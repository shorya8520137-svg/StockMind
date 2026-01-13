const db = require('../db/connection');

/**
 * =====================================================
 * DISPATCH BETA CONTROLLER - For frontend dispatch form
 * Handles dispatch creation with proper inventory updates
 * =====================================================
 */

/**
 * CREATE DISPATCH - Beta version for frontend form
 */
exports.createDispatch = (req, res) => {
    const {
        orderType,
        email,
        selectedWarehouse,
        selectedLogistics,
        selectedExecutive,
        selectedPaymentMode,
        parcelType,
        orderRef,
        customerName,
        awbNumber,
        dimensions,
        weight,
        invoiceAmount,
        remarks,
        products
    } = req.body;

    // Validation
    if (!selectedWarehouse || !orderRef || !customerName || !awbNumber || !products || products.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'selectedWarehouse, orderRef, customerName, awbNumber, and products are required'
        });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        // Process each product
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
                        error: `Invalid product format for product ${index + 1}: ${product.name}`
                    })
                );
            }

            // Check stock availability
            const checkStockSql = `
                SELECT SUM(qty_available) as available_stock 
                FROM stock_batches 
                WHERE barcode = ? AND warehouse = ? AND status = 'active'
            `;

            db.query(checkStockSql, [barcode, selectedWarehouse], (err, stockResult) => {
                if (err || hasError) {
                    if (!hasError) {
                        hasError = true;
                        return db.rollback(() =>
                            res.status(500).json({ success: false, error: err.message })
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
                            error: `Insufficient stock for ${productName}. Available: ${availableStock}, Required: ${qty}`
                        })
                    );
                }

                processedProducts++;

                // If all products are validated, create the dispatch
                if (processedProducts === totalProducts && !hasError) {
                    createDispatchRecord();
                }
            });
        });

        function createDispatchRecord() {
            // Create main dispatch record
            const dispatchSql = `
                INSERT INTO warehouse_dispatch (
                    warehouse, order_ref, customer, product_name, qty, barcode, awb,
                    logistics, parcel_type, actual_weight, payment_mode, invoice_amount,
                    processed_by, remarks, length, width, height
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            // For now, create one dispatch record with first product (you may want to modify this)
            const firstProduct = products[0];
            const firstBarcode = extractBarcode(firstProduct.name);
            const firstProductName = extractProductName(firstProduct.name);
            const totalQty = products.reduce((sum, p) => sum + (parseInt(p.qty) || 1), 0);

            db.query(dispatchSql, [
                selectedWarehouse,
                orderRef,
                customerName,
                firstProductName,
                totalQty,
                firstBarcode,
                awbNumber,
                selectedLogistics,
                parcelType || 'Forward',
                parseFloat(weight) || 0,
                selectedPaymentMode,
                parseFloat(invoiceAmount) || 0,
                selectedExecutive,
                remarks,
                parseFloat(dimensions?.length) || 0,
                parseFloat(dimensions?.width) || 0,
                parseFloat(dimensions?.height) || 0
            ], (err, dispatchResult) => {
                if (err) {
                    return db.rollback(() =>
                        res.status(500).json({ success: false, error: err.message })
                    );
                }

                const dispatchId = dispatchResult.insertId;

                // Now update stock for all products
                updateStockForAllProducts(dispatchId);
            });
        }

        function updateStockForAllProducts(dispatchId) {
            let updatedProducts = 0;

            products.forEach((product) => {
                const barcode = extractBarcode(product.name);
                const productName = extractProductName(product.name);
                const qty = parseInt(product.qty) || 1;

                // Update stock batches (FIFO)
                const getBatchesSql = `
                    SELECT id, qty_available 
                    FROM stock_batches 
                    WHERE barcode = ? AND warehouse = ? AND status = 'active' AND qty_available > 0
                    ORDER BY created_at ASC
                `;

                db.query(getBatchesSql, [barcode, selectedWarehouse], (err, batches) => {
                    if (err) {
                        return db.rollback(() =>
                            res.status(500).json({ success: false, error: err.message })
                        );
                    }

                    let remainingQty = qty;
                    let batchUpdateCount = 0;

                    batches.forEach((batch) => {
                        if (remainingQty <= 0) return;

                        const deductQty = Math.min(batch.qty_available, remainingQty);
                        const newQty = batch.qty_available - deductQty;
                        const newStatus = newQty === 0 ? 'exhausted' : 'active';

                        const updateBatchSql = `
                            UPDATE stock_batches 
                            SET qty_available = ?, status = ? 
                            WHERE id = ?
                        `;

                        db.query(updateBatchSql, [newQty, newStatus, batch.id], (err) => {
                            if (err) {
                                return db.rollback(() =>
                                    res.status(500).json({ success: false, error: err.message })
                                );
                            }

                            batchUpdateCount++;
                            remainingQty -= deductQty;

                            // Check if all batches for this product are updated
                            if (batchUpdateCount === batches.length || remainingQty <= 0) {
                                // Add ledger entry
                                const ledgerSql = `
                                    INSERT INTO inventory_ledger_base (
                                        event_time, movement_type, barcode, product_name,
                                        location_code, qty, direction, reference
                                    ) VALUES (NOW(), 'DISPATCH', ?, ?, ?, ?, 'OUT', ?)
                                `;

                                const reference = `DISPATCH_${dispatchId}_${awbNumber}`;

                                db.query(ledgerSql, [
                                    barcode, productName, selectedWarehouse, qty, reference
                                ], (err) => {
                                    if (err) {
                                        return db.rollback(() =>
                                            res.status(500).json({ success: false, error: err.message })
                                        );
                                    }

                                    updatedProducts++;

                                    // If all products are processed, commit transaction
                                    if (updatedProducts === totalProducts) {
                                        db.commit(err => {
                                            if (err) {
                                                return db.rollback(() =>
                                                    res.status(500).json({ success: false, error: err.message })
                                                );
                                            }

                                            res.status(201).json({
                                                success: true,
                                                message: 'Dispatch created successfully',
                                                dispatch_id: dispatchId,
                                                order_ref: orderRef,
                                                awb: awbNumber,
                                                products_dispatched: totalProducts,
                                                total_quantity: products.reduce((sum, p) => sum + (parseInt(p.qty) || 1), 0)
                                            });
                                        });
                                    }
                                });
                            }
                        });
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