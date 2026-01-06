const db = require('../db/connection');

exports.bulkUpload = async (req, res) => {
    const rows = req.body?.rows;
    
    if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'rows array is required'
        });
    }

    const success = [];
    const failed = [];

    try {
        // Begin transaction
        await new Promise((resolve, reject) => {
            db.beginTransaction(err => err ? reject(err) : resolve());
        });

        for (let i = 0; i < rows.length; i++) {
            const {
                barcode,
                product_name,
                variant = null,
                warehouse,      // ✅ COMING FROM FRONTEND
                qty,
                unit_cost = 0
            } = rows[i];

            // ---------- VALIDATION ----------
            if (!barcode || !product_name || !warehouse || qty === null || qty === undefined || isNaN(qty)) {
                failed.push({
                    row: i + 1,
                    reason: 'Missing or invalid required fields (barcode, product_name, warehouse required; qty must be a valid number)',
                    data: rows[i]
                });
                continue;
            }

            const reference = `BULK_UPLOAD_${barcode}_${Date.now()}`;

            // ---------- LEDGER INSERT ----------
            const ledgerId = await new Promise((resolve, reject) => {
                const sql = `INSERT INTO inventory_ledger_base (
                    event_time,
                    movement_type,
                    barcode,
                    product_name,
                    location_code,
                    qty,
                    direction,
                    reference
                ) VALUES (NOW(), 'BULK_UPLOAD', ?, ?, ?, ?, 'IN', ?)`;
                
                db.query(sql, [barcode, product_name, warehouse, qty, reference], (err, result) => {
                    err ? reject(err) : resolve(result.insertId);
                });
            });

            // ---------- STOCK BATCH INSERT ----------
            // Check if this is the first time this product is being added to this warehouse
            const existingBatchCheck = await new Promise((resolve, reject) => {
                const checkSql = `SELECT COUNT(*) as count FROM stock_batches 
                                 WHERE barcode = ? AND warehouse = ?`;
                db.query(checkSql, [barcode, warehouse], (err, result) => {
                    err ? reject(err) : resolve(result[0].count > 0);
                });
            });

            // Determine source type: OPENING for first entry, BULK_UPLOAD for subsequent
            const sourceType = existingBatchCheck ? 'BULK_UPLOAD' : 'OPENING';

            await new Promise((resolve, reject) => {
                const sql = `INSERT INTO stock_batches (
                    product_name,
                    barcode,
                    variant,
                    warehouse,
                    source_type,
                    source_ref_id,
                    qty_initial,
                    qty_available,
                    unit_cost,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`;
                
                db.query(sql, [
                    product_name,
                    barcode,
                    variant,
                    warehouse,
                    sourceType,  // ✅ DYNAMIC: OPENING for first, BULK_UPLOAD for subsequent
                    ledgerId,
                    qty,
                    qty,
                    unit_cost
                ], err => err ? reject(err) : resolve());
            });

            success.push({
                row: i + 1,
                barcode,
                warehouse,
                qty
            });
        }

        // Commit transaction
        await new Promise((resolve, reject) => {
            db.commit(err => err ? reject(err) : resolve());
        });

        res.json({
            success: true,
            inserted: success.length,
            failed: failed.length,
            successRows: success,
            failedRows: failed
        });

    } catch (error) {
        // Rollback transaction on error
        await new Promise(resolve => db.rollback(() => resolve()));
        
        res.status(500).json({
            success: false,
            message: 'Bulk upload failed',
            error: error.message
        });
    }
};

// New endpoint for bulk upload with progress streaming
exports.bulkUploadWithProgress = async (req, res) => {
    const rows = req.body?.rows;
    
    if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'rows array is required'
        });
    }

    // Set headers for Server-Sent Events
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const success = [];
    const failed = [];
    const totalRows = rows.length;

    // Send initial progress
    res.write(`data: ${JSON.stringify({
        type: 'start',
        total: totalRows,
        current: 0,
        message: 'Starting bulk upload...'
    })}\n\n`);

    try {
        // Begin transaction
        await new Promise((resolve, reject) => {
            db.beginTransaction(err => err ? reject(err) : resolve());
        });

        for (let i = 0; i < rows.length; i++) {
            const {
                barcode,
                product_name,
                variant = null,
                warehouse,
                qty,
                unit_cost = 0
            } = rows[i];

            // Send progress update
            res.write(`data: ${JSON.stringify({
                type: 'progress',
                total: totalRows,
                current: i + 1,
                percentage: Math.round(((i + 1) / totalRows) * 100),
                message: `Processing ${product_name} (${barcode})...`,
                barcode: barcode,
                product_name: product_name
            })}\n\n`);

            // ---------- VALIDATION ----------
            if (!barcode || !product_name || !warehouse || qty === null || qty === undefined || isNaN(qty)) {
                failed.push({
                    row: i + 1,
                    reason: 'Missing or invalid required fields (barcode, product_name, warehouse required; qty must be a valid number)',
                    data: rows[i]
                });
                
                // Send error update
                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    row: i + 1,
                    message: 'Validation failed for row ' + (i + 1) + ': Missing required fields or invalid quantity'
                })}\n\n`);
                
                continue;
            }

            const reference = `BULK_UPLOAD_${barcode}_${Date.now()}`;

            try {
                // ---------- LEDGER INSERT ----------
                const ledgerId = await new Promise((resolve, reject) => {
                    const sql = `INSERT INTO inventory_ledger_base (
                        event_time,
                        movement_type,
                        barcode,
                        product_name,
                        location_code,
                        qty,
                        direction,
                        reference
                    ) VALUES (NOW(), 'BULK_UPLOAD', ?, ?, ?, ?, 'IN', ?)`;
                    
                    db.query(sql, [barcode, product_name, warehouse, qty, reference], (err, result) => {
                        err ? reject(err) : resolve(result.insertId);
                    });
                });

                // ---------- STOCK BATCH INSERT ----------
                // Check if this is the first time this product is being added to this warehouse
                const existingBatchCheck = await new Promise((resolve, reject) => {
                    const checkSql = `SELECT COUNT(*) as count FROM stock_batches 
                                     WHERE barcode = ? AND warehouse = ?`;
                    db.query(checkSql, [barcode, warehouse], (err, result) => {
                        err ? reject(err) : resolve(result[0].count > 0);
                    });
                });

                // Determine source type: OPENING for first entry, BULK_UPLOAD for subsequent
                const sourceType = existingBatchCheck ? 'BULK_UPLOAD' : 'OPENING';

                await new Promise((resolve, reject) => {
                    const sql = `INSERT INTO stock_batches (
                        product_name,
                        barcode,
                        variant,
                        warehouse,
                        source_type,
                        source_ref_id,
                        qty_initial,
                        qty_available,
                        unit_cost,
                        status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`;
                    
                    db.query(sql, [
                        product_name,
                        barcode,
                        variant,
                        warehouse,
                        sourceType,  // ✅ DYNAMIC: OPENING for first, BULK_UPLOAD for subsequent
                        ledgerId,
                        qty,
                        qty,
                        unit_cost
                    ], err => err ? reject(err) : resolve());
                });

                success.push({
                    row: i + 1,
                    barcode,
                    warehouse,
                    qty,
                    sourceType  // Include source type in response for debugging
                });

                // Send success update
                res.write(`data: ${JSON.stringify({
                    type: 'success',
                    row: i + 1,
                    message: `Successfully inserted ${product_name} (${sourceType})`
                })}\n\n`);

            } catch (rowError) {
                failed.push({
                    row: i + 1,
                    reason: rowError.message,
                    data: rows[i]
                });

                // Send error update
                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    row: i + 1,
                    message: `Failed to insert row ${i + 1}: ${rowError.message}`
                })}\n\n`);
            }

            // Add small delay to make progress visible for demo
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Commit transaction
        await new Promise((resolve, reject) => {
            db.commit(err => err ? reject(err) : resolve());
        });

        // Send completion
        res.write(`data: ${JSON.stringify({
            type: 'complete',
            total: totalRows,
            inserted: success.length,
            failed: failed.length,
            successRows: success,
            failedRows: failed,
            message: `Upload complete! ${success.length} inserted, ${failed.length} failed`
        })}\n\n`);

    } catch (error) {
        // Rollback transaction on error
        await new Promise(resolve => db.rollback(() => resolve()));
        
        // Send error
        res.write(`data: ${JSON.stringify({
            type: 'error',
            message: 'Bulk upload failed: ' + error.message
        })}\n\n`);
    }

    res.end();
};

// Get warehouses for dropdown
exports.getWarehouses = async (req, res) => {
    try {
        const sql = 'SELECT w_id, warehouse_code, Warehouse_name FROM dispatch_warehouse ORDER BY Warehouse_name';
        
        db.query(sql, (err, results) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch warehouses',
                    error: err.message
                });
            }

            res.json({
                success: true,
                warehouses: results
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch warehouses',
            error: error.message
        });
    }
};

// Get bulk upload history/logs
exports.getBulkUploadHistory = async (req, res) => {
    try {
        const sql = `
            SELECT 
                reference,
                COUNT(*) as total_items,
                SUM(qty) as total_qty,
                MIN(event_time) as upload_time,
                location_code as warehouse
            FROM inventory_ledger_base 
            WHERE movement_type = 'BULK_UPLOAD' 
            GROUP BY reference, location_code
            ORDER BY upload_time DESC
            LIMIT 50
        `;
        
        db.query(sql, (err, results) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch upload history',
                    error: err.message
                });
            }

            res.json({
                success: true,
                history: results
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upload history',
            error: error.message
        });
    }
};