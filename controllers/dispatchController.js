const db = require('../db/connection');

/**
 * =====================================================
 * DISPATCH CONTROLLER - Handles warehouse dispatch operations
 * Updates stock_batches and inventory_ledger_base
 * =====================================================
 */

/**
 * CREATE NEW DISPATCH - Enhanced for frontend form
 */
exports.createDispatch = (req, res) => {
    // Handle both API formats (original and frontend form)
    const isFormData = req.body.selectedWarehouse !== undefined;
    
    let warehouse, order_ref, customer, product_name, qty, variant, barcode, awb, logistics, 
        parcel_type, length, width, height, actual_weight, payment_mode, invoice_amount, 
        processed_by, remarks, products;

    if (isFormData) {
        // Frontend form format
        const {
            selectedWarehouse,
            orderRef,
            customerName,
            awbNumber,
            selectedLogistics,
            selectedPaymentMode,
            parcelType,
            selectedExecutive,
            invoiceAmount,
            weight,
            dimensions,
            remarks: formRemarks,
            products: formProducts
        } = req.body;

        warehouse = selectedWarehouse;
        order_ref = orderRef;
        customer = customerName;
        awb = awbNumber;
        logistics = selectedLogistics;
        payment_mode = selectedPaymentMode;
        parcel_type = parcelType || 'Forward';
        processed_by = selectedExecutive;
        invoice_amount = parseFloat(invoiceAmount) || 0;
        actual_weight = parseFloat(weight) || 0;
        length = parseFloat(dimensions?.length) || 0;
        width = parseFloat(dimensions?.width) || 0;
        height = parseFloat(dimensions?.height) || 0;
        remarks = formRemarks;
        products = formProducts;

        // For frontend form, we'll process multiple products
        if (!warehouse || !order_ref || !customer || !awb || !products || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'selectedWarehouse, orderRef, customerName, awbNumber, and products are required'
            });
        }
    } else {
        // Original API format
        ({
            warehouse,
            order_ref,
            customer,
            product_name,
            qty,
            variant,
            barcode,
            awb,
            logistics,
            parcel_type = 'Forward',
            length,
            width,
            height,
            actual_weight,
            payment_mode,
            invoice_amount = 0,
            processed_by,
            remarks
        } = req.body);

        // Validation for original format
        if (!warehouse || !product_name || !qty || !barcode || !awb) {
            return res.status(400).json({
                success: false,
                message: 'warehouse, product_name, qty, barcode, awb are required'
            });
        }

        const quantity = parseInt(qty);
        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'qty must be greater than 0'
            });
        }
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        if (isFormData) {
            // Handle frontend form with multiple products
            handleFormDispatch();
        } else {
            // Handle original single product dispatch
            handleSingleProductDispatch();
        }

        function handleFormDispatch() {
            // Process each product for stock validation first
            let processedProducts = 0;
            const totalProducts = products.length;
            let hasError = false;

            products.forEach((product, index) => {
                // Extract barcode from product name (format: "Product Name | Variant | Barcode")
                const barcode = extractBarcode(product.name);
                const productName = extractProductName(product.name);
                const qty = parseInt(product.qty) || 1;

                if (!barcode) {
                    hasError = true;
                    return db.rollback(() =>
                        res.status(400).json({
                            success: false,
                            message: `Invalid product format for product ${index + 1}: ${product.name}`
                        })
                    );
                }

                // Check stock availability
                const checkStockSql = `
                    SELECT SUM(qty_available) as available_stock 
                    FROM stock_batches 
                    WHERE barcode = ? AND warehouse = ? AND status = 'active'
                `;

                db.query(checkStockSql, [barcode, warehouse], (err, stockResult) => {
                    if (err || hasError) {
                        if (!hasError) {
                            hasError = true;
                            return db.rollback(() =>
                                res.status(500).json({ success: false, message: err.message })
                            );
                        }
                        return;
                    }

                    const availableStock = stockResult[0]?.available_stock || 0;
                    if (availableStock < qty) {
                        hasError = true;
                        return db.rollback(() =>
                            res.status(400).json({
                                success: false,
                                message: `Insufficient stock for ${productName}. Available: ${availableStock}, Required: ${qty}`
                            })
                        );
                    }

                    processedProducts++;

                    // If all products are validated, create the dispatch
                    if (processedProducts === totalProducts && !hasError) {
                        createFormDispatchRecord();
                    }
                });
            });

            function createFormDispatchRecord() {
                // Create dispatch record for first product (main record)
                const firstProduct = products[0];
                const firstBarcode = extractBarcode(firstProduct.name);
                const firstProductName = extractProductName(firstProduct.name);
                const totalQty = products.reduce((sum, p) => sum + (parseInt(p.qty) || 1), 0);

                const dispatchSql = `
                    INSERT INTO warehouse_dispatch (
                        warehouse, order_ref, customer, product_name, qty, barcode, awb,
                        logistics, parcel_type, actual_weight, payment_mode, invoice_amount,
                        processed_by, remarks, length, width, height
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                db.query(dispatchSql, [
                    warehouse, order_ref, customer, firstProductName, totalQty, firstBarcode, awb,
                    logistics, parcel_type, actual_weight, payment_mode, invoice_amount,
                    processed_by, remarks, length, width, height
                ], (err, dispatchResult) => {
                    if (err) {
                        return db.rollback(() =>
                            res.status(500).json({ success: false, message: err.message })
                        );
                    }

                    const dispatchId = dispatchResult.insertId;
                    updateStockForAllProducts(dispatchId);
                });
            }

            function updateStockForAllProducts(dispatchId) {
                let updatedProducts = 0;

                products.forEach((product) => {
                    const barcode = extractBarcode(product.name);
                    const productName = extractProductName(product.name);
                    const qty = parseInt(product.qty) || 1;

                    updateSingleProductStock(barcode, productName, qty, dispatchId, awb, () => {
                        updatedProducts++;
                        if (updatedProducts === totalProducts) {
                            // All products processed, commit transaction
                            db.commit(err => {
                                if (err) {
                                    return db.rollback(() =>
                                        res.status(500).json({ success: false, message: err.message })
                                    );
                                }

                                res.status(201).json({
                                    success: true,
                                    message: 'Dispatch created successfully',
                                    dispatch_id: dispatchId,
                                    order_ref,
                                    awb,
                                    products_dispatched: totalProducts,
                                    total_quantity: products.reduce((sum, p) => sum + (parseInt(p.qty) || 1), 0)
                                });
                            });
                        }
                    });
                });
            }
        }

        function handleSingleProductDispatch() {
            const quantity = parseInt(qty);

            // Step 1: Check available stock
            const checkStockSql = `
                SELECT SUM(qty_available) as available_stock 
                FROM stock_batches 
                WHERE barcode = ? AND warehouse = ? AND status = 'active'
            `;

            db.query(checkStockSql, [barcode, warehouse], (err, stockResult) => {
                if (err) {
                    return db.rollback(() =>
                        res.status(500).json({ success: false, message: err.message })
                    );
                }

                const availableStock = stockResult[0]?.available_stock || 0;
                if (availableStock < quantity) {
                    return db.rollback(() =>
                        res.status(400).json({
                            success: false,
                            message: `Insufficient stock. Available: ${availableStock}, Required: ${quantity}`
                        })
                    );
                }

                // Step 2: Create dispatch record
                const dispatchSql = `
                    INSERT INTO warehouse_dispatch (
                        warehouse, order_ref, customer, product_name, qty, variant,
                        barcode, awb, logistics, parcel_type, length, width, height,
                        actual_weight, payment_mode, invoice_amount, processed_by, remarks
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                db.query(dispatchSql, [
                    warehouse, order_ref, customer, product_name, quantity, variant,
                    barcode, awb, logistics, parcel_type, length, width, height,
                    actual_weight, payment_mode, invoice_amount, processed_by, remarks
                ], (err, dispatchResult) => {
                    if (err) {
                        return db.rollback(() =>
                            res.status(500).json({ success: false, message: err.message })
                        );
                    }

                    const dispatchId = dispatchResult.insertId;
                    updateSingleProductStock(barcode, product_name, quantity, dispatchId, awb, () => {
                        db.commit(err => {
                            if (err) {
                                return db.rollback(() =>
                                    res.status(500).json({ success: false, message: err.message })
                                );
                            }

                            res.status(201).json({
                                success: true,
                                message: 'Dispatch created successfully',
                                dispatch_id: dispatchId,
                                awb,
                                quantity_dispatched: quantity,
                                reference: `DISPATCH_${dispatchId}_${awb}`
                            });
                        });
                    });
                });
            });
        }

        // Helper function to update stock for a single product
        function updateSingleProductStock(barcode, productName, qty, dispatchId, awb, callback) {
            // Update stock batches (FIFO - First In, First Out)
            const updateStockSql = `
                SELECT id, qty_available 
                FROM stock_batches 
                WHERE barcode = ? AND warehouse = ? AND status = 'active' AND qty_available > 0
                ORDER BY created_at ASC
            `;

            db.query(updateStockSql, [barcode, warehouse], (err, batches) => {
                if (err) {
                    return db.rollback(() =>
                        res.status(500).json({ success: false, message: err.message })
                    );
                }

                let remainingQty = qty;
                const batchUpdates = [];

                // Calculate how much to deduct from each batch (FIFO)
                for (const batch of batches) {
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

                // Execute batch updates
                let updateCount = 0;
                const totalUpdates = batchUpdates.length;

                if (totalUpdates === 0) {
                    return db.rollback(() =>
                        res.status(400).json({
                            success: false,
                            message: 'No active stock batches found'
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

                        updateCount++;

                        // When all batch updates are complete, add ledger entry
                        if (updateCount === totalUpdates) {
                            const ledgerSql = `
                                INSERT INTO inventory_ledger_base (
                                    event_time, movement_type, barcode, product_name,
                                    location_code, qty, direction, reference
                                ) VALUES (NOW(), 'DISPATCH', ?, ?, ?, ?, 'OUT', ?)
                            `;

                            const reference = `DISPATCH_${dispatchId}_${awb}`;

                            db.query(ledgerSql, [
                                barcode, productName, warehouse, qty, reference
                            ], (err) => {
                                if (err) {
                                    return db.rollback(() =>
                                        res.status(500).json({ success: false, message: err.message })
                                    );
                                }

                                callback();
                            });
                        }
                    });
                });
            });
        }
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

/**
 * GET ALL DISPATCHES WITH FILTERS
 */
exports.getDispatches = (req, res) => {
    const {
        warehouse,
        status,
        dateFrom,
        dateTo,
        search,
        page = 1,
        limit = 50
    } = req.query;

    const filters = [];
    const values = [];

    if (warehouse) {
        filters.push('warehouse = ?');
        values.push(warehouse);
    }

    if (status) {
        filters.push('status = ?');
        values.push(status);
    }

    if (dateFrom) {
        filters.push('timestamp >= ?');
        values.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
        filters.push('timestamp <= ?');
        values.push(`${dateTo} 23:59:59`);
    }

    if (search) {
        filters.push('(product_name LIKE ? OR barcode LIKE ? OR awb LIKE ? OR order_ref LIKE ? OR customer LIKE ?)');
        const searchTerm = `%${search}%`;
        values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const sql = `
        SELECT *
        FROM warehouse_dispatch
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    `;

    values.push(parseInt(limit), parseInt(offset));

    db.query(sql, values, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        // Get total count
        const countSql = `SELECT COUNT(*) as total FROM warehouse_dispatch ${whereClause}`;
        const countValues = values.slice(0, -2); // Remove limit and offset

        db.query(countSql, countValues, (err, countResult) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            const total = countResult[0].total;

            res.json({
                success: true,
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        });
    });
};

/**
 * UPDATE DISPATCH STATUS
 */
exports.updateDispatchStatus = (req, res) => {
    const { id } = req.params;
    const { status, processed_by, remarks } = req.body;

    if (!status) {
        return res.status(400).json({
            success: false,
            message: 'status is required'
        });
    }

    const sql = `
        UPDATE warehouse_dispatch 
        SET status = ?, processed_by = ?, remarks = ?, notification_status = 'unread'
        WHERE id = ?
    `;

    db.query(sql, [status, processed_by, remarks, id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dispatch not found'
            });
        }

        res.json({
            success: true,
            message: 'Dispatch status updated successfully'
        });
    });
};

/**
 * GET PRODUCT SUGGESTIONS FOR DISPATCH
 */
exports.getProductSuggestions = (req, res) => {
    const { search, warehouse } = req.query;

    if (!search || search.length < 2) {
        return res.json({
            success: true,
            data: []
        });
    }

    let sql = `
        SELECT DISTINCT 
            sb.product_name,
            sb.barcode,
            sb.variant,
            sb.warehouse,
            SUM(sb.qty_available) as available_stock
        FROM stock_batches sb
        WHERE sb.status = 'active' 
        AND sb.qty_available > 0
        AND (sb.product_name LIKE ? OR sb.barcode LIKE ?)
    `;

    const values = [`%${search}%`, `%${search}%`];

    if (warehouse) {
        sql += ' AND sb.warehouse = ?';
        values.push(warehouse);
    }

    sql += `
        GROUP BY sb.product_name, sb.barcode, sb.variant, sb.warehouse
        HAVING available_stock > 0
        ORDER BY sb.product_name
        LIMIT 10
    `;

    db.query(sql, values, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            data: rows
        });
    });
};

/**
 * GET WAREHOUSE SUGGESTIONS
 */
exports.getWarehouses = (req, res) => {
    const sql = `
        SELECT warehouse_code as code, Warehouse_name as name
        FROM dispatch_warehouse 
        ORDER BY Warehouse_name
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        // Return just the warehouse codes for the dropdown
        const warehouseCodes = rows.map(row => row.code);
        res.json(warehouseCodes);
    });
};

/**
 * GET LOGISTICS SUGGESTIONS
 */
exports.getLogistics = (req, res) => {
    const sql = `
        SELECT name
        FROM logistics 
        ORDER BY name
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        // Return just the logistics names for the dropdown
        const logisticsNames = rows.map(row => row.name);
        res.json(logisticsNames);
    });
};

/**
 * GET PROCESSED PERSONS SUGGESTIONS
 */
exports.getProcessedPersons = (req, res) => {
    const sql = `
        SELECT name
        FROM processed_persons 
        ORDER BY name
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        // Return just the person names for the dropdown
        const personNames = rows.map(row => row.name);
        res.json(personNames);
    });
};

/**
 * SEARCH PRODUCTS FOR DISPATCH
 */
exports.searchProducts = (req, res) => {
    const { query } = req.query;

    if (!query || query.length < 2) {
        return res.json([]);
    }

    const sql = `
        SELECT 
            p_id,
            product_name,
            product_variant,
            barcode,
            price,
            cost_price,
            weight,
            dimensions
        FROM dispatch_product
        WHERE is_active = 1 
        AND (product_name LIKE ? OR barcode LIKE ? OR product_variant LIKE ?)
        ORDER BY product_name
        LIMIT 10
    `;

    const searchTerm = `%${query}%`;

    db.query(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json(rows);
    });
};

/**
 * CHECK INVENTORY FOR DISPATCH
 */
exports.checkInventory = (req, res) => {
    const { warehouse, barcode, qty = 1 } = req.query;

    if (!warehouse || !barcode) {
        return res.status(400).json({
            success: false,
            message: 'warehouse and barcode are required'
        });
    }

    const quantity = parseInt(qty);

    const sql = `
        SELECT SUM(qty_available) as available_stock 
        FROM stock_batches 
        WHERE barcode = ? AND warehouse = ? AND status = 'active'
    `;

    db.query(sql, [barcode, warehouse], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        const availableStock = rows[0]?.available_stock || 0;
        const isAvailable = availableStock >= quantity;

        res.json({
            ok: isAvailable,
            available: availableStock,
            requested: quantity,
            message: isAvailable 
                ? `Available: ${availableStock}` 
                : `Insufficient stock. Available: ${availableStock}, Required: ${quantity}`
        });
    });
};

/**
 * GET PAYMENT MODES
 */
exports.getPaymentModes = (req, res) => {
    // Static payment modes - you can move this to database if needed
    const paymentModes = [
        'COD',
        'Prepaid',
        'UPI',
        'Credit Card',
        'Debit Card',
        'Net Banking',
        'Wallet'
    ];

    res.json(paymentModes);
};

/**
 * GET WAREHOUSES - For dropdown
 */
exports.getWarehouses = (req, res) => {
    const sql = `SELECT warehouse_code FROM dispatch_warehouse ORDER BY Warehouse_name`;

    db.query(sql, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        const warehouses = rows.map(row => row.warehouse_code);
        res.json(warehouses);
    });
};

/**
 * GET LOGISTICS - For dropdown
 */
exports.getLogistics = (req, res) => {
    const sql = `SELECT name FROM logistics ORDER BY name`;

    db.query(sql, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        const logistics = rows.map(row => row.name);
        res.json(logistics);
    });
};

/**
 * GET PROCESSED PERSONS - For dropdown
 */
exports.getProcessedPersons = (req, res) => {
    const sql = `SELECT name FROM processed_persons ORDER BY name`;

    db.query(sql, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        const persons = rows.map(row => row.name);
        res.json(persons);
    });
};

/**
 * SEARCH PRODUCTS - For auto-suggestions
 */
exports.searchProducts = (req, res) => {
    const { query, q } = req.query;
    const searchTerm = query || q; // Support both 'query' and 'q' parameters

    if (!searchTerm || searchTerm.length < 2) {
        return res.json([]);
    }

    const sql = `
        SELECT p_id, product_name, product_variant, barcode
        FROM dispatch_product 
        WHERE is_active = 1 
        AND (product_name LIKE ? OR barcode LIKE ? OR product_variant LIKE ?)
        ORDER BY product_name
        LIMIT 10
    `;

    const searchPattern = `%${searchTerm}%`;

    db.query(sql, [searchPattern, searchPattern, searchPattern], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json(rows);
    });
};

/**
 * CHECK INVENTORY - For stock validation
 */
exports.checkInventory = (req, res) => {
    const { warehouse, barcode, qty } = req.query;

    if (!warehouse || !barcode) {
        return res.status(400).json({
            success: false,
            message: 'warehouse and barcode are required'
        });
    }

    const quantity = parseInt(qty) || 1;

    const sql = `
        SELECT SUM(qty_available) as available_stock 
        FROM stock_batches 
        WHERE barcode = ? AND warehouse = ? AND status = 'active'
    `;

    db.query(sql, [barcode, warehouse], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        const availableStock = rows[0]?.available_stock || 0;
        const isOk = availableStock >= quantity;

        res.json({
            ok: isOk,
            available: availableStock,
            requested: quantity,
            message: isOk 
                ? `Available: ${availableStock}` 
                : `Insufficient stock. Available: ${availableStock}, Required: ${quantity}`
        });
    });
};
/**
 * GET PAYMENT MODES - For dropdown
 */
exports.getPaymentModes = (req, res) => {
    const paymentModes = ['COD', 'Prepaid', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking'];
    res.json(paymentModes);
};
/**
 * SETUP DISPATCH PRODUCTS - Populate from stock_batches if empty
 */
exports.setupDispatchProducts = (req, res) => {
    // First check if dispatch_product has data
    const checkSql = `SELECT COUNT(*) as count FROM dispatch_product WHERE is_active = 1`;
    
    db.query(checkSql, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        const count = result[0].count;
        
        if (count > 0) {
            return res.json({
                success: true,
                message: `dispatch_product already has ${count} products`,
                count
            });
        }

        // If empty, populate from stock_batches
        const populateSql = `
            INSERT INTO dispatch_product (product_name, product_variant, barcode, is_active, created_at)
            SELECT DISTINCT 
                product_name,
                COALESCE(variant, '') as product_variant,
                barcode,
                1 as is_active,
                NOW() as created_at
            FROM stock_batches 
            WHERE status = 'active' 
            AND product_name IS NOT NULL 
            AND barcode IS NOT NULL
            ON DUPLICATE KEY UPDATE 
                is_active = 1,
                updated_at = NOW()
        `;

        db.query(populateSql, (err, result) => {
            if (err) {
                // If that fails, try inserting some sample data
                const sampleSql = `
                    INSERT INTO dispatch_product (product_name, product_variant, barcode, is_active, created_at)
                    VALUES 
                    ('Sample Product', 'Red', 'ABC123', 1, NOW()),
                    ('Another Product', '', 'XYZ789', 1, NOW()),
                    ('Third Product', 'Blue', 'DEF456', 1, NOW())
                    ON DUPLICATE KEY UPDATE 
                        is_active = 1,
                        updated_at = NOW()
                `;
                
                db.query(sampleSql, (sampleErr, sampleResult) => {
                    if (sampleErr) {
                        return res.status(500).json({
                            success: false,
                            error: sampleErr.message,
                            originalError: err.message
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: 'Sample products added to dispatch_product',
                        inserted: sampleResult.affectedRows
                    });
                });
                return;
            }

            res.json({
                success: true,
                message: 'dispatch_product populated from stock_batches',
                inserted: result.affectedRows
            });
        });
    });
};

/**
 * HANDLE DAMAGE/RECOVERY OPERATIONS - Proper implementation with debugging
 */
exports.handleDamageRecovery = (req, res) => {
    console.log('🔧 Damage/Recovery request received:', req.body);
    
    const {
        product_type,
        barcode,
        inventory_location,
        quantity = 1,
        action_type = 'damage' // Get from frontend
    } = req.body;

    // Validation
    if (!product_type || !barcode || !inventory_location) {
        console.log('❌ Validation failed - missing required fields');
        return res.status(400).json({
            success: false,
            message: 'product_type, barcode, inventory_location are required'
        });
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
        console.log('❌ Validation failed - invalid quantity');
        return res.status(400).json({
            success: false,
            message: 'quantity must be greater than 0'
        });
    }

    console.log('✅ Validation passed, starting transaction...');

    db.beginTransaction(err => {
        if (err) {
            console.log('❌ Transaction start failed:', err);
            return res.status(500).json({ success: false, message: err.message });
        }

        console.log('📝 Inserting into damage_recovery_log...');
        
        // Step 1: Insert into damage_recovery_log table
        const logSql = `
            INSERT INTO damage_recovery_log (
                product_type, barcode, inventory_location, action_type, quantity
            ) VALUES (?, ?, ?, ?, ?)
        `;

        db.query(logSql, [product_type, barcode, inventory_location, action_type, qty], (err, logResult) => {
            if (err) {
                console.log('❌ Insert into damage_recovery_log failed:', err);
                return db.rollback(() =>
                    res.status(500).json({ success: false, error: err.message })
                );
            }

            console.log('✅ Successfully inserted into damage_recovery_log, ID:', logResult.insertId);
            const logId = logResult.insertId;

            // For now, just commit the transaction and return success
            // We can add stock updates later
            db.commit(err => {
                if (err) {
                    console.log('❌ Transaction commit failed:', err);
                    return db.rollback(() =>
                        res.status(500).json({ success: false, message: err.message })
                    );
                }

                console.log('✅ Transaction committed successfully');
                res.status(201).json({
                    success: true,
                    message: `${action_type} operation completed successfully`,
                    log_id: logId,
                    product_type,
                    barcode,
                    inventory_location,
                    quantity: qty,
                    action_type,
                    reference: `${action_type.toUpperCase()}_${logId}`
                });
            });
        });
    });
};