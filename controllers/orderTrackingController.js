const db = require('../db/connection');

/**
 * =====================================================
 * ORDER TRACKING CONTROLLER (Updated for Real Data)
 * Uses warehouse_dispatch, damage_recovery_log, returns_log
 * =====================================================
 */

/**
 * GET DISPATCH TIMELINE
 * Get complete timeline for a specific dispatch/order
 */
exports.getDispatchTimeline = (req, res) => {
    const { dispatchId } = req.params;
    const { limit = 50 } = req.query;

    console.log('📊 Dispatch timeline request for:', dispatchId);

    if (!dispatchId) {
        return res.status(400).json({
            success: false,
            message: 'Dispatch ID is required'
        });
    }

    // Get dispatch details first
    const dispatchSql = `
        SELECT 
            wd.*,
            wdi.id as item_id,
            wdi.product_name as item_product_name,
            wdi.variant as item_variant,
            wdi.barcode as item_barcode,
            wdi.qty as item_qty,
            wdi.selling_price
        FROM warehouse_dispatch wd
        LEFT JOIN warehouse_dispatch_items wdi ON wd.id = wdi.dispatch_id
        WHERE wd.id = ? OR wd.order_ref = ? OR wd.awb = ?
    `;

    db.query(dispatchSql, [dispatchId, dispatchId, dispatchId], (err, dispatchData) => {
        if (err) {
            console.error('❌ Dispatch query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (dispatchData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dispatch not found'
            });
        }

        const dispatch = dispatchData[0];
        const items = dispatchData.filter(item => item.item_id).map(item => ({
            id: item.item_id,
            product_name: item.item_product_name,
            variant: item.item_variant,
            barcode: item.item_barcode,
            qty: item.item_qty,
            selling_price: item.selling_price
        }));

        // Get timeline from multiple sources
        const timelineSql = `
            SELECT 
                'dispatch' as source,
                id,
                timestamp,
                'DISPATCH' as type,
                product_name,
                barcode,
                warehouse,
                qty as quantity,
                'OUT' as direction,
                CONCAT('DISPATCH_', id, '_', awb) as reference,
                CONCAT('Dispatched ', qty, ' units via ', logistics) as description,
                status,
                awb,
                logistics,
                payment_mode,
                invoice_amount
            FROM warehouse_dispatch 
            WHERE id = ? OR order_ref = ? OR awb = ?
            
            UNION ALL
            
            SELECT 
                'damage_recovery' as source,
                id,
                timestamp,
                UPPER(action_type) as type,
                product_type as product_name,
                barcode,
                inventory_location as warehouse,
                quantity,
                CASE 
                    WHEN action_type = 'damage' THEN 'OUT'
                    WHEN action_type = 'recover' THEN 'IN'
                    ELSE 'IN'
                END as direction,
                CONCAT(action_type, '#', id) as reference,
                CASE 
                    WHEN action_type = 'damage' THEN CONCAT('Reported ', quantity, ' units as damaged')
                    WHEN action_type = 'recover' THEN CONCAT('Recovered ', quantity, ' units from damage')
                    ELSE CONCAT(action_type, ': ', quantity, ' units')
                END as description,
                NULL as status,
                NULL as awb,
                NULL as logistics,
                NULL as payment_mode,
                NULL as invoice_amount
            FROM damage_recovery_log 
            WHERE barcode = ?
            
            UNION ALL
            
            SELECT 
                'self_transfer' as source,
                id,
                event_time as timestamp,
                'SELF_TRANSFER' as type,
                product_name,
                barcode,
                location_code as warehouse,
                qty as quantity,
                direction,
                reference,
                CASE 
                    WHEN direction = 'OUT' THEN CONCAT('Self Transfer OUT: ', qty, ' units from ', location_code)
                    WHEN direction = 'IN' THEN CONCAT('Self Transfer IN: ', qty, ' units to ', location_code)
                    ELSE CONCAT('Self Transfer: ', qty, ' units (', direction, ')')
                END as description,
                NULL as status,
                NULL as awb,
                NULL as logistics,
                NULL as payment_mode,
                NULL as invoice_amount
            FROM inventory_ledger_base 
            WHERE barcode = ? AND movement_type = 'SELF_TRANSFER'
            
            UNION ALL
            
            SELECT 
                'inventory_ledger' as source,
                id,
                event_time as timestamp,
                movement_type as type,
                product_name,
                barcode,
                location_code as warehouse,
                qty as quantity,
                direction,
                reference,
                CONCAT(movement_type, ': ', qty, ' units (', direction, ')') as description,
                NULL as status,
                NULL as awb,
                NULL as logistics,
                NULL as payment_mode,
                NULL as invoice_amount
            FROM inventory_ledger_base 
            WHERE barcode = ? AND reference LIKE CONCAT('%', ?, '%')
            
            ORDER BY timestamp DESC
            LIMIT ?
        `;

        db.query(timelineSql, [
            dispatchId, dispatchId, dispatchId, // dispatch queries
            dispatch.barcode, // damage_recovery query
            dispatch.barcode, // self_transfer query
            dispatch.barcode, dispatchId, // inventory_ledger query
            parseInt(limit)
        ], (err, timeline) => {
            if (err) {
                console.error('❌ Timeline query error:', err);
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            // Get current stock for the product
            const stockSql = `
                SELECT 
                    SUM(qty_available) as current_stock
                FROM stock_batches 
                WHERE barcode = ? AND status = 'active'
            `;

            db.query(stockSql, [dispatch.barcode], (err, stockData) => {
                if (err) {
                    console.error('❌ Stock query error:', err);
                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });
                }

                const currentStock = stockData[0]?.current_stock || 0;

                // Calculate summary
                const summary = {
                    total_movements: timeline.length,
                    dispatched: timeline.filter(t => t.type === 'DISPATCH').reduce((sum, t) => sum + parseInt(t.quantity), 0),
                    damaged: timeline.filter(t => t.type === 'DAMAGE').reduce((sum, t) => sum + parseInt(t.quantity), 0),
                    recovered: timeline.filter(t => t.type === 'RECOVER').reduce((sum, t) => sum + parseInt(t.quantity), 0),
                    self_transfer_in: timeline.filter(t => t.type === 'SELF_TRANSFER' && t.direction === 'IN').reduce((sum, t) => sum + parseInt(t.quantity), 0),
                    self_transfer_out: timeline.filter(t => t.type === 'SELF_TRANSFER' && t.direction === 'OUT').reduce((sum, t) => sum + parseInt(t.quantity), 0),
                    current_stock: currentStock
                };

                res.json({
                    success: true,
                    data: {
                        dispatch: {
                            id: dispatch.id,
                            status: dispatch.status,
                            warehouse: dispatch.warehouse,
                            order_ref: dispatch.order_ref,
                            customer: dispatch.customer,
                            product_name: dispatch.product_name,
                            barcode: dispatch.barcode,
                            qty: dispatch.qty,
                            awb: dispatch.awb,
                            logistics: dispatch.logistics,
                            payment_mode: dispatch.payment_mode,
                            invoice_amount: dispatch.invoice_amount,
                            timestamp: dispatch.timestamp,
                            items: items
                        },
                        timeline: timeline.map(item => ({
                            ...item,
                            quantity: parseInt(item.quantity),
                            timestamp: item.timestamp
                        })),
                        summary
                    }
                });
            });
        });
    });
};

/**
 * GET ALL DISPATCHES WITH TRACKING INFO
 * Get all dispatches with damage/recovery counts + self transfers
 */
exports.getAllDispatches = (req, res) => {
    const { 
        warehouse, 
        status, 
        dateFrom, 
        dateTo, 
        page = 1, 
        limit = 20 
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

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    // Combined query for both dispatches and self transfers
    const sql = `
        SELECT 
            'dispatch' as source_type,
            wd.id,
            wd.timestamp,
            wd.warehouse,
            wd.order_ref,
            wd.customer,
            wd.product_name,
            wd.barcode,
            wd.qty,
            wd.variant,
            wd.awb,
            wd.logistics,
            wd.parcel_type,
            wd.length,
            wd.width,
            wd.height,
            wd.actual_weight,
            wd.payment_mode,
            wd.invoice_amount,
            wd.processed_by,
            wd.remarks,
            wd.status,
            COALESCE(d.damage_count, 0) as damage_count,
            COALESCE(rec.recovery_count, 0) as recovery_count,
            COALESCE(sb.current_stock, 0) as current_stock
        FROM warehouse_dispatch wd
        LEFT JOIN (
            SELECT barcode, COUNT(*) as damage_count 
            FROM damage_recovery_log 
            WHERE action_type = 'damage' 
            GROUP BY barcode
        ) d ON wd.barcode = d.barcode
        LEFT JOIN (
            SELECT barcode, COUNT(*) as recovery_count 
            FROM damage_recovery_log 
            WHERE action_type = 'recover' 
            GROUP BY barcode
        ) rec ON wd.barcode = rec.barcode
        LEFT JOIN (
            SELECT barcode, SUM(qty_available) as current_stock 
            FROM stock_batches 
            WHERE status = 'active'
            GROUP BY barcode
        ) sb ON wd.barcode = sb.barcode
        ${whereClause}
        
        UNION ALL
        
        SELECT 
            'self_transfer' as source_type,
            ilb.id,
            ilb.event_time as timestamp,
            ilb.location_code as warehouse,
            SUBSTRING_INDEX(ilb.reference, '_', 3) as order_ref,
            CONCAT('Self Transfer (', ilb.direction, ')') as customer,
            ilb.product_name,
            ilb.barcode,
            ilb.qty,
            NULL as variant,
            NULL as awb,
            'Self Transfer' as logistics,
            'Self Transfer' as parcel_type,
            NULL as length,
            NULL as width,
            NULL as height,
            NULL as actual_weight,
            'Internal' as payment_mode,
            0 as invoice_amount,
            'System' as processed_by,
            CONCAT('Self Transfer ', ilb.direction, ' - ', ilb.reference) as remarks,
            'Completed' as status,
            0 as damage_count,
            0 as recovery_count,
            COALESCE(sb2.current_stock, 0) as current_stock
        FROM inventory_ledger_base ilb
        LEFT JOIN (
            SELECT barcode, SUM(qty_available) as current_stock 
            FROM stock_batches 
            WHERE status = 'active'
            GROUP BY barcode
        ) sb2 ON ilb.barcode = sb2.barcode
        WHERE ilb.movement_type = 'SELF_TRANSFER'
        ${warehouse ? 'AND ilb.location_code = ?' : ''}
        ${dateFrom ? 'AND ilb.event_time >= ?' : ''}
        ${dateTo ? 'AND ilb.event_time <= ?' : ''}
        
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    `;

    // Build values array for the combined query
    const combinedValues = [...values]; // For warehouse_dispatch WHERE clause
    
    // Add values for self_transfer WHERE clause
    if (warehouse) combinedValues.push(warehouse);
    if (dateFrom) combinedValues.push(`${dateFrom} 00:00:00`);
    if (dateTo) combinedValues.push(`${dateTo} 23:59:59`);
    
    // Add pagination
    combinedValues.push(parseInt(limit), parseInt(offset));

    db.query(sql, combinedValues, (err, results) => {
        if (err) {
            console.error('❌ Combined dispatches query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        // Get total count for both dispatches and self transfers
        const countSql = `
            SELECT 
                (SELECT COUNT(*) FROM warehouse_dispatch wd ${whereClause}) +
                (SELECT COUNT(*) FROM inventory_ledger_base ilb 
                 WHERE ilb.movement_type = 'SELF_TRANSFER'
                 ${warehouse ? 'AND ilb.location_code = ?' : ''}
                 ${dateFrom ? 'AND ilb.event_time >= ?' : ''}
                 ${dateTo ? 'AND ilb.event_time <= ?' : ''}) as total
        `;

        const countValues = [...values]; // For warehouse_dispatch count
        // Add values for self_transfer count
        if (warehouse) countValues.push(warehouse);
        if (dateFrom) countValues.push(`${dateFrom} 00:00:00`);
        if (dateTo) countValues.push(`${dateTo} 23:59:59`);

        db.query(countSql, countValues, (err, countResult) => {
            if (err) {
                console.error('❌ Count query error:', err);
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            const total = countResult[0]?.total || 0;

            res.json({
                success: true,
                data: results,
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
 * REPORT DISPATCH DAMAGE
 * Report damage for dispatched items
 */
exports.reportDispatchDamage = (req, res) => {
    const { dispatchId } = req.params;
    const {
        product_name,
        barcode,
        warehouse,
        quantity = 1,
        reason,
        notes
    } = req.body;

    if (!product_name || !barcode || !warehouse) {
        return res.status(400).json({
            success: false,
            message: 'product_name, barcode, warehouse are required'
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
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        // Insert into damage_recovery_log
        const damageSql = `
            INSERT INTO damage_recovery_log (
                product_type, barcode, inventory_location, action_type, quantity
            ) VALUES (?, ?, ?, 'damage', ?)
        `;

        db.query(damageSql, [product_name, barcode, warehouse, qty], (err, result) => {
            if (err) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, error: err.message })
                );
            }

            const damageId = result.insertId;

            // Update stock_batches (FIFO)
            const getBatchesSql = `
                SELECT id, qty_available 
                FROM stock_batches 
                WHERE barcode = ? AND warehouse = ? AND status = 'active' AND qty_available > 0
                ORDER BY created_at ASC
            `;

            db.query(getBatchesSql, [barcode, warehouse], (err, batches) => {
                if (err) {
                    return db.rollback(() =>
                        res.status(500).json({ success: false, error: err.message })
                    );
                }

                if (batches.length === 0) {
                    return db.rollback(() =>
                        res.status(400).json({
                            success: false,
                            message: 'No active stock batches found'
                        })
                    );
                }

                let remainingQty = qty;
                let updateCount = 0;

                batches.forEach(batch => {
                    if (remainingQty <= 0) {
                        updateCount++;
                        if (updateCount === batches.length) commitTransaction();
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

                        if (updateCount === batches.length) {
                            commitTransaction();
                        }
                    });
                });

                function commitTransaction() {
                    // Add to inventory ledger
                    const ledgerSql = `
                        INSERT INTO inventory_ledger_base (
                            event_time, movement_type, barcode, product_name,
                            location_code, qty, direction, reference
                        ) VALUES (NOW(), 'DISPATCH_DAMAGE', ?, ?, ?, ?, 'OUT', ?)
                    `;

                    db.query(ledgerSql, [barcode, product_name, warehouse, qty, `dispatch_damage#${damageId}`], (err) => {
                        if (err) {
                            console.log('⚠️ Ledger insert failed:', err);
                        }

                        db.commit(err => {
                            if (err) {
                                return db.rollback(() =>
                                    res.status(500).json({ success: false, message: err.message })
                                );
                            }

                            res.status(201).json({
                                success: true,
                                message: 'Dispatch damage reported successfully',
                                damage_id: damageId,
                                dispatch_id: dispatchId,
                                quantity: qty,
                                reference: `dispatch_damage#${damageId}`
                            });
                        });
                    });
                }
            });
        });
    });
};

/**
 * GET DISPATCH SUMMARY STATS
 */
exports.getDispatchStats = (req, res) => {
    const { warehouse, dateFrom, dateTo } = req.query;

    const filters = [];
    const values = [];

    if (warehouse) {
        filters.push('warehouse = ?');
        values.push(warehouse);
    }

    if (dateFrom) {
        filters.push('timestamp >= ?');
        values.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
        filters.push('timestamp <= ?');
        values.push(`${dateTo} 23:59:59`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const sql = `
        SELECT 
            COUNT(*) as total_dispatches,
            SUM(qty) as total_quantity,
            SUM(invoice_amount) as total_amount,
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
            COUNT(CASE WHEN status = 'Dispatched' THEN 1 END) as dispatched_count,
            COUNT(CASE WHEN status = 'Delivered' THEN 1 END) as delivered_count,
            warehouse
        FROM warehouse_dispatch 
        ${whereClause}
        GROUP BY warehouse
        ORDER BY total_dispatches DESC
    `;

    db.query(sql, values, (err, stats) => {
        if (err) {
            console.error('❌ Stats query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            data: stats
        });
    });
};

/**
 * DELETE DISPATCH WITH STOCK RESTORATION
 * Deletes a dispatch and restores stock quantities to stock_batches
 */
exports.deleteDispatch = (req, res) => {
    const { dispatchId } = req.params;

    console.log('🗑️ Delete dispatch request for:', dispatchId);

    if (!dispatchId) {
        return res.status(400).json({
            success: false,
            message: 'Dispatch ID is required'
        });
    }

    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        // First, get dispatch details
        const getDispatchSql = `
            SELECT * FROM warehouse_dispatch 
            WHERE id = ?
        `;

        db.query(getDispatchSql, [dispatchId], (err, dispatchData) => {
            if (err) {
                return db.rollback(() =>
                    res.status(500).json({ success: false, error: err.message })
                );
            }

            if (dispatchData.length === 0) {
                return db.rollback(() =>
                    res.status(404).json({ success: false, message: 'Dispatch not found' })
                );
            }

            const dispatch = dispatchData[0];
            const { barcode, qty, warehouse, product_name } = dispatch;

            // CORRECT LOGIC: Restore stock to existing stock_batches
            // Find the most recent batches that were affected (LIFO for restoration)
            const getBatchesSql = `
                SELECT id, qty_available, status
                FROM stock_batches 
                WHERE barcode = ? AND warehouse = ? 
                ORDER BY created_at DESC
                LIMIT 10
            `;

            db.query(getBatchesSql, [barcode, warehouse], (err, batches) => {
                if (err) {
                    return db.rollback(() =>
                        res.status(500).json({ success: false, error: err.message })
                    );
                }

                if (batches.length === 0) {
                    return db.rollback(() =>
                        res.status(400).json({ 
                            success: false, 
                            message: 'No stock batches found for this product' 
                        })
                    );
                }

                // Restore stock using LIFO (Last In, First Out) - reverse of dispatch FIFO
                let remainingQty = qty;
                const batchUpdates = [];

                for (const batch of batches) {
                    if (remainingQty <= 0) break;

                    // Add back the quantity to this batch
                    const restoreQty = remainingQty; // Restore all remaining to this batch
                    const newQty = batch.qty_available + restoreQty;
                    const newStatus = 'active'; // Always set to active when restoring

                    batchUpdates.push({
                        id: batch.id,
                        newQty,
                        newStatus,
                        restoreQty
                    });

                    remainingQty = 0; // All quantity restored to this batch
                }

                // If we couldn't restore to existing batches, create a new one
                if (remainingQty > 0) {
                    const createBatchSql = `
                        INSERT INTO stock_batches (
                            barcode, product_name, warehouse, qty_available, 
                            status, created_at, batch_ref, source_type
                        ) VALUES (?, ?, ?, ?, 'active', NOW(), ?, 'DISPATCH_REVERSAL')
                    `;

                    const batchRef = `RESTORE_DISPATCH_${dispatchId}_${Date.now()}`;

                    db.query(createBatchSql, [
                        barcode, product_name, warehouse, remainingQty, batchRef
                    ], (err) => {
                        if (err) {
                            return db.rollback(() =>
                                res.status(500).json({ success: false, error: err.message })
                            );
                        }

                        // Continue with existing batch updates
                        updateBatchesAndComplete();
                    });
                } else {
                    // All quantity can be restored to existing batches
                    updateBatchesAndComplete();
                }

                function updateBatchesAndComplete() {
                    if (batchUpdates.length === 0) {
                        // No batch updates needed, just add ledger and delete dispatch
                        addLedgerAndDeleteDispatch();
                        return;
                    }

                    let updateCount = 0;
                    const totalUpdates = batchUpdates.length;

                    batchUpdates.forEach(update => {
                        const updateBatchSql = `
                            UPDATE stock_batches 
                            SET qty_available = ?, status = ? 
                            WHERE id = ?
                        `;

                        db.query(updateBatchSql, [update.newQty, update.newStatus, update.id], (err) => {
                            if (err) {
                                return db.rollback(() =>
                                    res.status(500).json({ success: false, error: err.message })
                                );
                            }

                            updateCount++;

                            if (updateCount === totalUpdates) {
                                addLedgerAndDeleteDispatch();
                            }
                        });
                    });
                }

                function addLedgerAndDeleteDispatch() {
                    // Add reversal entry to inventory ledger
                    const ledgerSql = `
                        INSERT INTO inventory_ledger_base (
                            event_time, movement_type, barcode, product_name,
                            location_code, qty, direction, reference
                        ) VALUES (NOW(), 'DISPATCH_REVERSAL', ?, ?, ?, ?, 'IN', ?)
                    `;

                    db.query(ledgerSql, [
                        barcode, product_name, warehouse, qty, `DISPATCH_DELETE_${dispatchId}`
                    ], (err) => {
                        if (err) {
                            console.log('⚠️ Ledger insert failed:', err);
                            // Continue anyway - stock restoration is more important
                        }

                        // Delete the dispatch record
                        const deleteDispatchSql = `DELETE FROM warehouse_dispatch WHERE id = ?`;

                        db.query(deleteDispatchSql, [dispatchId], (err) => {
                            if (err) {
                                return db.rollback(() =>
                                    res.status(500).json({ success: false, error: err.message })
                                );
                            }

                            // Delete related dispatch items
                            const deleteItemsSql = `DELETE FROM warehouse_dispatch_items WHERE dispatch_id = ?`;

                            db.query(deleteItemsSql, [dispatchId], (err) => {
                                if (err) {
                                    console.log('⚠️ Failed to delete dispatch items:', err);
                                    // Continue anyway
                                }

                                db.commit(err => {
                                    if (err) {
                                        return db.rollback(() =>
                                            res.status(500).json({ success: false, message: err.message })
                                        );
                                    }

                                    res.json({
                                        success: true,
                                        message: 'Dispatch deleted successfully and stock restored',
                                        deleted_dispatch_id: dispatchId,
                                        restored_quantity: qty,
                                        restored_product: product_name,
                                        warehouse: warehouse,
                                        stock_restoration: 'Stock quantities restored to stock_batches table'
                                    });
                                });
                            });
                        });
                    });
                }
            });
        });
    });
};

module.exports = exports;