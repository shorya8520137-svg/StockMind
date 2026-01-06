const db = require('../db/connection');

/**
 * =====================================================
 * DAMAGE & RECOVERY CONTROLLER
 * Handles damage reporting and recovery operations
 * Updates stock_batches and inventory_ledger_base
 * =====================================================
 */

/**
 * REPORT DAMAGE - Complete implementation with stock updates
 */
exports.reportDamage = (req, res) => {
    console.log('🔧 Damage report request received:', req.body);
    
    const {
        product_type,
        barcode,
        inventory_location,
        quantity = 1,
        action_type = 'damage'
    } = req.body;

    // Basic validation
    if (!product_type || !barcode || !inventory_location) {
        return res.status(400).json({
            success: false,
            message: 'product_type, barcode, inventory_location are required'
        });
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
        return res.status(400).json({
            success: false,
            message: 'quantity must be greater than 0'
        });
    }

    // Start database transaction
    db.beginTransaction(err => {
        if (err) {
            console.log('❌ Transaction start failed:', err);
            return res.status(500).json({ success: false, message: err.message });
        }

        // Step 1: Check available stock
        const checkStockSql = `
            SELECT SUM(qty_available) as available_stock 
            FROM stock_batches 
            WHERE barcode = ? AND warehouse = ? AND status = 'active'
        `;

        db.query(checkStockSql, [barcode, inventory_location], (err, stockResult) => {
            if (err) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, error: err.message })
                );
            }

            const availableStock = stockResult[0]?.available_stock || 0;
            if (availableStock < qty) {
                return db.rollback(() =>
                    res.status(400).json({
                        success: false,
                        message: `Insufficient stock. Available: ${availableStock}, Required: ${qty}`
                    })
                );
            }

            // Step 2: Insert into damage_recovery_log table
            const logSql = `
                INSERT INTO damage_recovery_log (
                    product_type, barcode, inventory_location, action_type, quantity
                ) VALUES (?, ?, ?, ?, ?)
            `;

            db.query(logSql, [product_type, barcode, inventory_location, action_type, qty], (err, result) => {
                if (err) {
                    console.log('❌ Insert failed:', err);
                    return db.rollback(() =>
                        res.status(500).json({ success: false, error: err.message })
                    );
                }

                console.log('✅ Successfully inserted into damage_recovery_log, ID:', result.insertId);
                const damageId = result.insertId;

                // Step 3: Update stock_batches (FIFO - First In, First Out)
                const getBatchesSql = `
                    SELECT id, qty_available 
                    FROM stock_batches 
                    WHERE barcode = ? AND warehouse = ? AND status = 'active' AND qty_available > 0
                    ORDER BY created_at ASC
                `;

                db.query(getBatchesSql, [barcode, inventory_location], (err, batches) => {
                    if (err) {
                        return db.rollback(() =>
                            res.status(500).json({ success: false, error: err.message })
                        );
                    }

                    let remainingQty = qty;
                    let updateCount = 0;
                    const totalUpdates = batches.length;

                    if (totalUpdates === 0) {
                        return db.rollback(() =>
                            res.status(400).json({
                                success: false,
                                message: 'No active stock batches found'
                            })
                        );
                    }

                    // Update each batch (FIFO)
                    batches.forEach(batch => {
                        if (remainingQty <= 0) {
                            updateCount++;
                            if (updateCount === totalUpdates) {
                                addLedgerAndCommit();
                            }
                            return;
                        }

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

                            remainingQty -= deductQty;
                            updateCount++;

                            if (updateCount === totalUpdates) {
                                addLedgerAndCommit();
                            }
                        });
                    });

                    function addLedgerAndCommit() {
                        // Step 4: Add to inventory_ledger_base (correct table)
                        const ledgerSql = `
                            INSERT INTO inventory_ledger_base (
                                event_time, movement_type, barcode, product_name,
                                location_code, qty, direction, reference
                            ) VALUES (NOW(), 'DAMAGE', ?, ?, ?, ?, 'OUT', ?)
                        `;

                        const reference = `damage#${damageId}`;

                        db.query(ledgerSql, [barcode, product_type, inventory_location, qty, reference], (err) => {
                            if (err) {
                                console.log('❌ Ledger insert failed:', err);
                                // Don't fail the whole transaction for ledger issues
                                console.log('⚠️ Continuing without ledger entry...');
                            }

                            // Step 5: Commit transaction
                            db.commit(err => {
                                if (err) {
                                    console.log('❌ Commit failed:', err);
                                    return db.rollback(() =>
                                        res.status(500).json({ success: false, message: err.message })
                                    );
                                }

                                console.log('✅ Transaction committed successfully');
                                res.status(201).json({
                                    success: true,
                                    message: 'Damage reported successfully',
                                    damage_id: damageId,
                                    product_type,
                                    barcode,
                                    inventory_location,
                                    quantity: qty,
                                    action_type,
                                    reference: `damage#${damageId}`,
                                    stock_updated: true
                                });
                            });
                        });
                    }
                });
            });
        });
    });
};

/**
 * RECOVER STOCK - Complete implementation with stock updates
 */
exports.recoverStock = (req, res) => {
    console.log('🔧 Recovery request received:', req.body);
    
    const {
        product_type,
        barcode,
        inventory_location,
        quantity = 1
    } = req.body;

    // Basic validation
    if (!product_type || !barcode || !inventory_location) {
        return res.status(400).json({
            success: false,
            message: 'product_type, barcode, inventory_location are required'
        });
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
        return res.status(400).json({
            success: false,
            message: 'quantity must be greater than 0'
        });
    }

    // Start database transaction
    db.beginTransaction(err => {
        if (err) {
            console.log('❌ Transaction start failed:', err);
            return res.status(500).json({ success: false, message: err.message });
        }

        // Step 1: Insert into damage_recovery_log table
        const logSql = `
            INSERT INTO damage_recovery_log (
                product_type, barcode, inventory_location, action_type, quantity
            ) VALUES (?, ?, ?, 'recover', ?)
        `;

        db.query(logSql, [product_type, barcode, inventory_location, qty], (err, result) => {
            if (err) {
                console.log('❌ Insert failed:', err);
                return db.rollback(() =>
                    res.status(500).json({ success: false, error: err.message })
                );
            }

            console.log('✅ Successfully inserted into damage_recovery_log, ID:', result.insertId);
            const recoveryId = result.insertId;

            // Step 2: Add stock back to inventory
            // Check if there's an existing active batch for this product
            const findBatchSql = `
                SELECT id, qty_available 
                FROM stock_batches 
                WHERE barcode = ? AND warehouse = ? AND product_name = ? AND status = 'active'
                ORDER BY created_at DESC 
                LIMIT 1
            `;

            db.query(findBatchSql, [barcode, inventory_location, product_type], (err, batches) => {
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

                        addRecoveryLedgerAndCommit();
                    });
                } else {
                    // Create new batch
                    const createBatchSql = `
                        INSERT INTO stock_batches (
                            product_name, barcode, warehouse, source_type,
                            qty_initial, qty_available, unit_cost, status, source_ref_id
                        ) VALUES (?, ?, ?, 'RECOVER', ?, ?, 0.00, 'active', ?)
                    `;

                    db.query(createBatchSql, [
                        product_type, barcode, inventory_location, qty, qty, recoveryId
                    ], (err) => {
                        if (err) {
                            return db.rollback(() =>
                                res.status(500).json({ success: false, error: err.message })
                            );
                        }

                        addRecoveryLedgerAndCommit();
                    });
                }

                function addRecoveryLedgerAndCommit() {
                    // Step 3: Add to inventory_ledger_base (correct table)
                    const ledgerSql = `
                        INSERT INTO inventory_ledger_base (
                            event_time, movement_type, barcode, product_name,
                            location_code, qty, direction, reference
                        ) VALUES (NOW(), 'RECOVER', ?, ?, ?, ?, 'IN', ?)
                    `;

                    const reference = `recover#${recoveryId}`;

                    db.query(ledgerSql, [barcode, product_type, inventory_location, qty, reference], (err) => {
                        if (err) {
                            console.log('❌ Ledger insert failed:', err);
                            // Don't fail the whole transaction for ledger issues
                            console.log('⚠️ Continuing without ledger entry...');
                        }

                        // Step 4: Commit transaction
                        db.commit(err => {
                            if (err) {
                                console.log('❌ Commit failed:', err);
                                return db.rollback(() =>
                                    res.status(500).json({ success: false, message: err.message })
                                );
                            }

                            console.log('✅ Transaction committed successfully');
                            res.status(201).json({
                                success: true,
                                message: 'Stock recovered successfully',
                                recovery_id: recoveryId,
                                product_type,
                                barcode,
                                inventory_location,
                                quantity: qty,
                                action_type: 'recover',
                                reference: `recover#${recoveryId}`,
                                stock_updated: true
                            });
                        });
                    });
                }
            });
        });
    });
};

/**
 * GET DAMAGE & RECOVERY LOG
 */
exports.getDamageRecoveryLog = (req, res) => {
    const {
        inventory_location,
        action_type,
        dateFrom,
        dateTo,
        search,
        page = 1,
        limit = 50
    } = req.query;

    const filters = [];
    const values = [];

    if (inventory_location) {
        filters.push('inventory_location = ?');
        values.push(inventory_location);
    }

    if (action_type && action_type !== 'both') {
        filters.push('action_type = ?');
        values.push(action_type);
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
        filters.push('(product_type LIKE ? OR barcode LIKE ?)');
        const searchTerm = `%${search}%`;
        values.push(searchTerm, searchTerm);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const sql = `
        SELECT *
        FROM damage_recovery_log
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

        res.json({
            success: true,
            data: rows
        });
    });
};

/**
 * GET DAMAGE/RECOVERY SUMMARY BY WAREHOUSE
 */
exports.getDamageRecoverySummary = (req, res) => {
    const { dateFrom, dateTo } = req.query;

    let dateFilter = '';
    const values = [];

    if (dateFrom) {
        dateFilter += ' AND timestamp >= ?';
        values.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
        dateFilter += ' AND timestamp <= ?';
        values.push(`${dateTo} 23:59:59`);
    }

    const sql = `
        SELECT 
            inventory_location as warehouse,
            action_type,
            COUNT(*) as transaction_count,
            SUM(quantity) as total_quantity
        FROM damage_recovery_log
        WHERE 1=1 ${dateFilter}
        GROUP BY inventory_location, action_type
        ORDER BY inventory_location, action_type
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