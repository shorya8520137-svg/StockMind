const db = require('../db/connection');

/**
 * =====================================================
 * RETURNS CONTROLLER - Handles return operations
 * Updates stock_batches and inventory_ledger_base
 * =====================================================
 */

/**
 * CREATE NEW RETURN
 */
exports.createReturn = (req, res) => {
    const {
        order_ref,
        awb,
        product_type,
        warehouse,
        quantity = 1,
        barcode,
        has_parts = false,
        return_reason,
        condition = 'good', // good, damaged, defective
        processed_by
    } = req.body;

    // Validation
    if (!product_type || !warehouse || !barcode) {
        return res.status(400).json({
            success: false,
            message: 'product_type, warehouse, barcode are required'
        });
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
        return res.status(400).json({
            success: false,
            message: 'quantity must be greater than 0'
        });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        // Step 1: Create return record
        const returnSql = `
            INSERT INTO returns_main (
                order_ref, awb, product_type, warehouse, quantity, barcode, has_parts
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(returnSql, [
            order_ref, awb, product_type, warehouse, qty, barcode, has_parts
        ], (err, returnResult) => {
            if (err) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, error: err.message })
                );
            }

            const returnId = returnResult.insertId;

            // Step 2: Add stock back to inventory (only if condition is good)
            if (condition === 'good') {
                // Check if there's an existing active batch for this product
                const findBatchSql = `
                    SELECT id, qty_available 
                    FROM stock_batches 
                    WHERE barcode = ? AND warehouse = ? AND product_name = ? AND status = 'active'
                    ORDER BY created_at DESC 
                    LIMIT 1
                `;

                db.query(findBatchSql, [barcode, warehouse, product_type], (err, batches) => {
                    if (err) {
                        return db.rollback(() =>
                            res.status(500).json({ success: false, error: err.message })
                        );
                    }

                    if (batches.length > 0) {
                        // Update existing batch
                        const batch = batches[0];
                        const newQty = batch.qty_available + qty;

                        const updateBatchSql = `
                            UPDATE stock_batches 
                            SET qty_available = ?, status = 'active'
                            WHERE id = ?
                        `;

                        db.query(updateBatchSql, [newQty, batch.id], (err) => {
                            if (err) {
                                return db.rollback(() =>
                                    res.status(500).json({ success: false, error: err.message })
                                );
                            }

                            // Add ledger entry and complete transaction
                            addLedgerEntryAndCommit(returnId, barcode, product_type, warehouse, qty, awb, res, db);
                        });
                    } else {
                        // Create new batch
                        const createBatchSql = `
                            INSERT INTO stock_batches (
                                product_name, barcode, warehouse, source_type,
                                qty_initial, qty_available, unit_cost, status, source_ref_id
                            ) VALUES (?, ?, ?, 'RETURN', ?, ?, 0.00, 'active', ?)
                        `;

                        db.query(createBatchSql, [
                            product_type, barcode, warehouse, qty, qty, returnId
                        ], (err) => {
                            if (err) {
                                return db.rollback(() =>
                                    res.status(500).json({ success: false, error: err.message })
                                );
                            }

                            // Add ledger entry and complete transaction
                            addLedgerEntryAndCommit(returnId, barcode, product_type, warehouse, qty, awb, res, db);
                        });
                    }
                });
            } else {
                // For damaged/defective items, just add ledger entry without adding stock
                addLedgerEntryAndCommit(returnId, barcode, product_type, warehouse, qty, awb, res, db, condition);
            }
        });
    });
};

/**
 * Helper function to add ledger entry and commit transaction
 */
function addLedgerEntryAndCommit(returnId, barcode, product_type, warehouse, qty, awb, res, db, condition = 'good') {
    const ledgerSql = `
        INSERT INTO inventory_ledger_base (
            event_time, movement_type, barcode, product_name,
            location_code, qty, direction, reference
        ) VALUES (NOW(), ?, ?, ?, ?, ?, 'IN', ?)
    `;

    const movementType = condition === 'good' ? 'RETURN' : `RETURN_${condition.toUpperCase()}`;
    const reference = `RETURN_${returnId}_${awb || 'NO_AWB'}`;

    db.query(ledgerSql, [
        movementType, barcode, product_type, warehouse, qty, reference
    ], (err) => {
        if (err) {
            return db.rollback(() =>
                res.status(500).json({ success: false, error: err.message })
            );
        }

        // Commit transaction
        db.commit(err => {
            if (err) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, message: err.message })
                );
            }

            res.status(201).json({
                success: true,
                message: `Return processed successfully${condition !== 'good' ? ` (${condition} - no stock added)` : ''}`,
                return_id: returnId,
                quantity_returned: qty,
                condition,
                stock_added: condition === 'good',
                reference
            });
        });
    });
}

/**
 * GET ALL RETURNS WITH FILTERS
 */
exports.getReturns = (req, res) => {
    const {
        warehouse,
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

    if (dateFrom) {
        filters.push('submitted_at >= ?');
        values.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
        filters.push('submitted_at <= ?');
        values.push(`${dateTo} 23:59:59`);
    }

    if (search) {
        filters.push('(product_type LIKE ? OR barcode LIKE ? OR awb LIKE ? OR order_ref LIKE ?)');
        const searchTerm = `%${search}%`;
        values.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const sql = `
        SELECT *
        FROM returns_main
        ${whereClause}
        ORDER BY submitted_at DESC
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
        const countSql = `SELECT COUNT(*) as total FROM returns_main ${whereClause}`;
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
 * GET RETURN BY ID
 */
exports.getReturnById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT r.*, 
               il.reference as ledger_reference,
               il.event_time as processed_at
        FROM returns_main r
        LEFT JOIN inventory_ledger_base il ON il.reference LIKE CONCAT('RETURN_', r.id, '%')
        WHERE r.id = ?
    `;

    db.query(sql, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Return not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    });
};

/**
 * GET PRODUCT SUGGESTIONS FOR RETURNS
 */
exports.getProductSuggestions = (req, res) => {
    const { search, q } = req.query;
    const searchTerm = search || q; // Support both 'search' and 'q' parameters

    if (!searchTerm || searchTerm.length < 2) {
        return res.json([]);
    }

    // Use dispatch_product table for consistency
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
 * BULK RETURN PROCESSING
 */
exports.processBulkReturns = (req, res) => {
    const { returns } = req.body;

    if (!Array.isArray(returns) || returns.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'returns array is required and must not be empty'
        });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        let processedCount = 0;
        const results = [];
        const totalReturns = returns.length;

        returns.forEach((returnItem, index) => {
            const {
                order_ref,
                awb,
                product_type,
                warehouse,
                quantity = 1,
                barcode,
                condition = 'good'
            } = returnItem;

            // Validate each return
            if (!product_type || !warehouse || !barcode) {
                results.push({
                    index,
                    success: false,
                    message: 'product_type, warehouse, barcode are required'
                });
                processedCount++;
                
                if (processedCount === totalReturns) {
                    completeBulkReturn(results, res, db);
                }
                return;
            }

            // Process individual return (simplified version)
            const returnSql = `
                INSERT INTO returns_main (
                    order_ref, awb, product_type, warehouse, quantity, barcode
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(returnSql, [
                order_ref, awb, product_type, warehouse, parseInt(quantity), barcode
            ], (err, returnResult) => {
                if (err) {
                    results.push({
                        index,
                        success: false,
                        error: err.message
                    });
                } else {
                    results.push({
                        index,
                        success: true,
                        return_id: returnResult.insertId,
                        message: 'Return processed successfully'
                    });
                }

                processedCount++;
                
                if (processedCount === totalReturns) {
                    completeBulkReturn(results, res, db);
                }
            });
        });
    });
};

function completeBulkReturn(results, res, db) {
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    if (failureCount === 0) {
        db.commit(err => {
            if (err) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, message: err.message })
                );
            }

            res.json({
                success: true,
                message: `All ${successCount} returns processed successfully`,
                results
            });
        });
    } else {
        db.rollback(() => {
            res.status(400).json({
                success: false,
                message: `${failureCount} returns failed, ${successCount} would have succeeded`,
                results
            });
        });
    }
}