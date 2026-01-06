const db = require('../db/connection');

/**
 * =====================================================
 * SELF TRANSFER CONTROLLER
 * Handles warehouse-to-warehouse and store transfers
 * Updates stock_batches and inventory_ledger_base
 * =====================================================
 */

/**
 * CREATE SELF TRANSFER
 * Host warehouse subtracts stock, Receiver warehouse adds stock
 * Both entries appear in timeline as SELF_TRANSFER events
 */
exports.createSelfTransfer = (req, res) => {
    console.log('🔄 Self Transfer request received:', req.body);
    
    const {
        transferType,
        sourceWarehouse,
        sourceStore,
        destinationWarehouse,
        destinationStore,
        orderRef,
        awbNumber,
        selectedLogistics,
        selectedPaymentMode,
        selectedExecutive,
        invoiceAmount,
        weight,
        dimensions,
        remarks,
        products
    } = req.body;

    // Determine host and receiver locations
    const hostLocation = sourceWarehouse || sourceStore;
    const receiverLocation = destinationWarehouse || destinationStore;

    // Validation
    if (!hostLocation || !receiverLocation) {
        return res.status(400).json({
            success: false,
            message: 'Source and destination locations are required'
        });
    }

    if (!orderRef || !products || products.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Order reference and products are required'
        });
    }

    if (hostLocation === receiverLocation) {
        return res.status(400).json({
            success: false,
            message: 'Source and destination cannot be the same'
        });
    }

    console.log(`🔄 Self Transfer: ${hostLocation} → ${receiverLocation}`);

    db.beginTransaction(err => {
        if (err) {
            console.log('❌ Transaction start failed:', err);
            return res.status(500).json({ success: false, message: err.message });
        }

        // Step 1: Validate stock availability for all products
        let validationCount = 0;
        const totalProducts = products.length;
        let hasValidationError = false;

        products.forEach((product, index) => {
            const barcode = extractBarcode(product.name);
            const productName = extractProductName(product.name);
            const qty = parseInt(product.qty) || 1;

            if (!barcode) {
                hasValidationError = true;
                return db.rollback(() =>
                    res.status(400).json({
                        success: false,
                        message: `Invalid product format for product ${index + 1}: ${product.name}`
                    })
                );
            }

            // Check stock availability in host location
            const checkStockSql = `
                SELECT SUM(qty_available) as available_stock 
                FROM stock_batches 
                WHERE barcode = ? AND warehouse = ? AND status = 'active'
            `;

            db.query(checkStockSql, [barcode, hostLocation], (err, stockResult) => {
                if (err || hasValidationError) {
                    if (!hasValidationError) {
                        hasValidationError = true;
                        return db.rollback(() =>
                            res.status(500).json({ success: false, message: err.message })
                        );
                    }
                    return;
                }

                const availableStock = stockResult[0]?.available_stock || 0;
                if (availableStock < qty) {
                    hasValidationError = true;
                    return db.rollback(() =>
                        res.status(400).json({
                            success: false,
                            message: `Insufficient stock for ${productName} in ${hostLocation}. Available: ${availableStock}, Required: ${qty}`
                        })
                    );
                }

                validationCount++;

                // If all products are validated, proceed with transfer
                if (validationCount === totalProducts && !hasValidationError) {
                    processSelfTransfer();
                }
            });
        });

        function processSelfTransfer() {
            console.log('✅ Stock validation passed, processing transfer...');
            
            let processedProducts = 0;
            const transferReference = `SELF_TRANSFER_${orderRef}_${Date.now()}`;

            products.forEach((product) => {
                const barcode = extractBarcode(product.name);
                const productName = extractProductName(product.name);
                const qty = parseInt(product.qty) || 1;

                // Process each product transfer
                processSingleProductTransfer(barcode, productName, qty, transferReference, () => {
                    processedProducts++;
                    if (processedProducts === totalProducts) {
                        // All products processed, commit transaction
                        db.commit(err => {
                            if (err) {
                                return db.rollback(() =>
                                    res.status(500).json({ success: false, message: err.message })
                                );
                            }

                            console.log('✅ Self Transfer completed successfully');
                            res.status(201).json({
                                success: true,
                                message: 'Self Transfer created successfully',
                                transfer_reference: transferReference,
                                order_ref: orderRef,
                                host_location: hostLocation,
                                receiver_location: receiverLocation,
                                products_transferred: totalProducts,
                                total_quantity: products.reduce((sum, p) => sum + (parseInt(p.qty) || 1), 0),
                                transfer_type: transferType
                            });
                        });
                    }
                });
            });
        }

        // Helper function to process single product transfer
        function processSingleProductTransfer(barcode, productName, qty, transferReference, callback) {
            console.log(`🔄 Processing transfer: ${productName} (${qty} units)`);

            // Step 1: Deduct stock from host location (FIFO)
            const getHostBatchesSql = `
                SELECT id, qty_available 
                FROM stock_batches 
                WHERE barcode = ? AND warehouse = ? AND status = 'active' AND qty_available > 0
                ORDER BY created_at ASC
            `;

            db.query(getHostBatchesSql, [barcode, hostLocation], (err, hostBatches) => {
                if (err) {
                    return db.rollback(() =>
                        res.status(500).json({ success: false, message: err.message })
                    );
                }

                let remainingQty = qty;
                const batchUpdates = [];

                // Calculate deductions (FIFO)
                for (const batch of hostBatches) {
                    if (remainingQty <= 0) break;

                    const deductQty = Math.min(batch.qty_available, remainingQty);
                    const newQty = batch.qty_available - deductQty;
                    const newStatus = newQty === 0 ? 'exhausted' : 'active';

                    batchUpdates.push({
                        id: batch.id,
                        newQty,
                        newStatus,
                        deductQty
                    });

                    remainingQty -= deductQty;
                }

                // Execute host batch updates
                let hostUpdateCount = 0;
                const totalHostUpdates = batchUpdates.length;

                if (totalHostUpdates === 0) {
                    return db.rollback(() =>
                        res.status(400).json({
                            success: false,
                            message: 'No active stock batches found in host location'
                        })
                    );
                }

                batchUpdates.forEach(update => {
                    const updateBatchSql = `
                        UPDATE stock_batches 
                        SET qty_available = ?, status = ? 
                        WHERE id = ?
                    `;

                    db.query(updateBatchSql, [update.newQty, update.newStatus, update.id], (err) => {
                        if (err) {
                            return db.rollback(() =>
                                res.status(500).json({ success: false, message: err.message })
                            );
                        }

                        hostUpdateCount++;

                        // When all host updates are complete, add stock to receiver
                        if (hostUpdateCount === totalHostUpdates) {
                            addStockToReceiver();
                        }
                    });
                });

                function addStockToReceiver() {
                    console.log(`➕ Adding ${qty} units to receiver: ${receiverLocation}`);

                    // Step 2: Add stock to receiver location
                    // Check if there's an existing active batch for this product at receiver
                    const findReceiverBatchSql = `
                        SELECT id, qty_available 
                        FROM stock_batches 
                        WHERE barcode = ? AND warehouse = ? AND product_name = ? AND status = 'active'
                        ORDER BY created_at DESC 
                        LIMIT 1
                    `;

                    db.query(findReceiverBatchSql, [barcode, receiverLocation, productName], (err, receiverBatches) => {
                        if (err) {
                            return db.rollback(() =>
                                res.status(500).json({ success: false, message: err.message })
                            );
                        }

                        if (receiverBatches.length > 0) {
                            // Update existing batch
                            const batch = receiverBatches[0];
                            const newQty = batch.qty_available + qty;

                            const updateReceiverBatchSql = `
                                UPDATE stock_batches 
                                SET qty_available = ?, status = 'active'
                                WHERE id = ?
                            `;

                            db.query(updateReceiverBatchSql, [newQty, batch.id], (err) => {
                                if (err) {
                                    return db.rollback(() =>
                                        res.status(500).json({ success: false, message: err.message })
                                    );
                                }

                                addLedgerEntries();
                            });
                        } else {
                            // Create new batch at receiver
                            const createReceiverBatchSql = `
                                INSERT INTO stock_batches (
                                    product_name, barcode, warehouse, source_type,
                                    qty_initial, qty_available, unit_cost, status
                                ) VALUES (?, ?, ?, 'SELF_TRANSFER', ?, ?, 0.00, 'active')
                            `;

                            db.query(createReceiverBatchSql, [
                                productName, barcode, receiverLocation, qty, qty
                            ], (err) => {
                                if (err) {
                                    return db.rollback(() =>
                                        res.status(500).json({ success: false, message: err.message })
                                    );
                                }

                                addLedgerEntries();
                            });
                        }

                        function addLedgerEntries() {
                            console.log('📝 Adding ledger entries...');

                            // Step 3: Add dual ledger entries
                            // Host entry (OUT)
                            const hostLedgerSql = `
                                INSERT INTO inventory_ledger_base (
                                    event_time, movement_type, barcode, product_name,
                                    location_code, qty, direction, reference
                                ) VALUES (NOW(), 'SELF_TRANSFER', ?, ?, ?, ?, 'OUT', ?)
                            `;

                            db.query(hostLedgerSql, [
                                barcode, productName, hostLocation, qty, transferReference
                            ], (err) => {
                                if (err) {
                                    console.log('⚠️ Host ledger insert failed:', err);
                                }

                                // Receiver entry (IN)
                                const receiverLedgerSql = `
                                    INSERT INTO inventory_ledger_base (
                                        event_time, movement_type, barcode, product_name,
                                        location_code, qty, direction, reference
                                    ) VALUES (NOW(), 'SELF_TRANSFER', ?, ?, ?, ?, 'IN', ?)
                                `;

                                db.query(receiverLedgerSql, [
                                    barcode, productName, receiverLocation, qty, transferReference
                                ], (err) => {
                                    if (err) {
                                        console.log('⚠️ Receiver ledger insert failed:', err);
                                    }

                                    console.log(`✅ Product transfer completed: ${productName}`);
                                    callback();
                                });
                            });
                        }
                    });
                }
            });
        }
    });
};

/**
 * GET SELF TRANSFERS
 * Get all self transfer records with filters
 */
exports.getSelfTransfers = (req, res) => {
    const {
        warehouse,
        dateFrom,
        dateTo,
        search,
        page = 1,
        limit = 50
    } = req.query;

    const filters = ["movement_type = 'SELF_TRANSFER'"];
    const values = [];

    if (warehouse) {
        filters.push('location_code = ?');
        values.push(warehouse);
    }

    if (dateFrom) {
        filters.push('event_time >= ?');
        values.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
        filters.push('event_time <= ?');
        values.push(`${dateTo} 23:59:59`);
    }

    if (search) {
        filters.push('(product_name LIKE ? OR barcode LIKE ? OR reference LIKE ?)');
        const searchTerm = `%${search}%`;
        values.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;
    const offset = (page - 1) * limit;

    const sql = `
        SELECT 
            id,
            event_time as timestamp,
            movement_type as type,
            barcode,
            product_name,
            location_code as warehouse,
            qty as quantity,
            direction,
            reference
        FROM inventory_ledger_base 
        ${whereClause}
        ORDER BY event_time DESC
        LIMIT ? OFFSET ?
    `;

    values.push(parseInt(limit), parseInt(offset));

    db.query(sql, values, (err, transfers) => {
        if (err) {
            console.error('❌ Self transfers query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        // Get total count
        const countSql = `SELECT COUNT(*) as total FROM inventory_ledger_base ${whereClause}`;
        const countValues = values.slice(0, -2);

        db.query(countSql, countValues, (err, countResult) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            const total = countResult[0]?.total || 0;

            res.json({
                success: true,
                data: transfers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            });
        });
    });
};

/**
 * Helper function to extract barcode from product string
 */
function extractBarcode(productString) {
    if (!productString || !productString.includes('|')) return '';
    const parts = productString.split('|').map(s => s.trim());
    return parts[parts.length - 1];
}

/**
 * Helper function to extract product name from product string
 */
function extractProductName(productString) {
    if (!productString || !productString.includes('|')) return productString;
    const parts = productString.split('|').map(s => s.trim());
    return parts[0];
}

module.exports = exports;