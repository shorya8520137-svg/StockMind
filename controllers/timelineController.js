const db = require('../db/connection');

/**
 * =====================================================
 * TIMELINE CONTROLLER
 * Handles product timeline tracking across all operations
 * =====================================================
 */

/**
 * GET PRODUCT TIMELINE
 * Shows all inventory movements for a specific product filtered by warehouse
 */
exports.getProductTimeline = (req, res) => {
    const { productCode } = req.params;
    const { warehouse, dateFrom, dateTo, limit = 50 } = req.query;

    console.log('📊 Timeline request for product:', productCode, 'warehouse:', warehouse);

    if (!productCode) {
        return res.status(400).json({
            success: false,
            message: 'Product code/barcode is required'
        });
    }

    const filters = ['barcode = ?'];
    const values = [productCode];

    // CRITICAL: Warehouse filter - only show entries for this specific warehouse
    if (warehouse && warehouse !== 'ALL') {
        filters.push('location_code = ?');
        values.push(warehouse);
        console.log('🏢 Filtering by warehouse:', warehouse);
    }

    // Date filters
    if (dateFrom) {
        filters.push('event_time >= ?');
        values.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
        filters.push('event_time <= ?');
        values.push(`${dateTo} 23:59:59`);
    }

    // Simple timeline query using only inventory_ledger_base to avoid duplicates
    const timelineSql = `
        SELECT 
            id,
            event_time as timestamp,
            movement_type as type,
            barcode,
            product_name,
            location_code as warehouse,
            qty as quantity,
            direction,
            reference,
            'ledger' as source
        FROM inventory_ledger_base 
        WHERE ${filters.join(' AND ')}
        ORDER BY event_time DESC
        LIMIT ?
    `;

    const timelineValues = [...values, parseInt(limit)];

    console.log('🔍 Simple Timeline SQL (ledger only):', timelineSql);
    console.log('🔍 Timeline Values:', timelineValues);

    db.query(timelineSql, timelineValues, (err, timeline) => {
        if (err) {
            console.error('❌ Timeline query error:', err);
            
            // Fallback response when database is not accessible
            if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
                console.log('🔄 Database timeout - returning fallback response');
                return res.json({
                    success: true,
                    data: {
                        product_code: productCode,
                        warehouse_filter: warehouse,
                        timeline: [],
                        current_stock: [],
                        summary: {
                            total_entries: 0,
                            opening_stock: 0,
                            total_in: 0,
                            total_out: 0,
                            net_movement: 0,
                            current_stock: 0,
                            breakdown: {
                                bulk_upload: 0,
                                dispatch: 0,
                                damage: 0,
                                recovery: 0,
                                returns: 0,
                                self_transfer_in: 0,
                                self_transfer_out: 0
                            }
                        }
                    },
                    message: 'Database connection timeout - showing empty timeline'
                });
            }
            
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        console.log('✅ Timeline found:', timeline.length, 'entries for warehouse:', warehouse);

        // Get current stock status for the specific warehouse
        const stockSql = `
            SELECT 
                barcode,
                product_name,
                warehouse,
                SUM(qty_available) as current_stock,
                COUNT(*) as batch_count
            FROM stock_batches 
            WHERE barcode = ? AND status = 'active'
            ${warehouse && warehouse !== 'ALL' ? 'AND warehouse = ?' : ''}
            GROUP BY barcode, product_name, warehouse
        `;

        const stockValues = [productCode];
        if (warehouse && warehouse !== 'ALL') stockValues.push(warehouse);

        db.query(stockSql, stockValues, (err, stockData) => {
            if (err) {
                console.error('❌ Stock query error:', err);
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            // Format timeline data and calculate running balance
            // Sort timeline by timestamp (oldest first) for balance calculation
            const sortedTimeline = timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            let runningBalance = 0;
            const formattedTimeline = sortedTimeline.map(item => {
                const quantity = parseInt(item.quantity);
                
                // Update running balance based on direction
                if (item.direction === 'IN') {
                    runningBalance += quantity;
                } else {
                    runningBalance -= quantity;
                }
                
                return {
                    id: item.id,
                    timestamp: item.timestamp,
                    type: item.type.toUpperCase(),
                    product_name: item.product_name,
                    barcode: item.barcode,
                    warehouse: item.warehouse,
                    quantity: quantity,
                    direction: item.direction,
                    reference: item.reference,
                    source: item.source,
                    balance_after: runningBalance,
                    description: getTimelineDescription(item)
                };
            });
            
            // Sort back to newest first for display
            formattedTimeline.reverse();

            // Calculate summary stats for this specific warehouse
            const totalIn = formattedTimeline
                .filter(item => item.direction === 'IN')
                .reduce((sum, item) => sum + item.quantity, 0);

            const totalOut = formattedTimeline
                .filter(item => item.direction === 'OUT')
                .reduce((sum, item) => sum + item.quantity, 0);

            const currentStockFromBatches = stockData.reduce((sum, batch) => 
                sum + parseInt(batch.current_stock || 0), 0
            );

            // Calculate opening stock (earliest entries)
            const openingEntries = formattedTimeline.filter(item => 
                item.type === 'BULK_UPLOAD' || item.type === 'OPENING'
            );
            const openingStock = openingEntries.reduce((sum, item) => 
                item.direction === 'IN' ? sum + item.quantity : sum - item.quantity, 0
            );

            res.json({
                success: true,
                data: {
                    product_code: productCode,
                    warehouse_filter: warehouse,
                    timeline: formattedTimeline,
                    current_stock: stockData,
                    summary: {
                        total_entries: formattedTimeline.length,
                        opening_stock: openingStock,
                        total_in: totalIn,
                        total_out: totalOut,
                        net_movement: totalIn - totalOut,
                        current_stock: currentStockFromBatches,
                        // Breakdown by operation type for this warehouse
                        breakdown: {
                            bulk_upload: formattedTimeline.filter(t => t.type === 'BULK_UPLOAD' || t.type === 'OPENING').reduce((sum, t) => sum + (t.direction === 'IN' ? t.quantity : 0), 0),
                            dispatch: formattedTimeline.filter(t => t.type === 'DISPATCH').reduce((sum, t) => sum + t.quantity, 0),
                            damage: formattedTimeline.filter(t => t.type === 'DAMAGE').reduce((sum, t) => sum + t.quantity, 0),
                            recovery: formattedTimeline.filter(t => t.type === 'RECOVER').reduce((sum, t) => sum + t.quantity, 0),
                            returns: formattedTimeline.filter(t => t.type === 'RETURN').reduce((sum, t) => sum + t.quantity, 0),
                            self_transfer_in: formattedTimeline.filter(t => t.type === 'SELF_TRANSFER' && t.direction === 'IN').reduce((sum, t) => sum + t.quantity, 0),
                            self_transfer_out: formattedTimeline.filter(t => t.type === 'SELF_TRANSFER' && t.direction === 'OUT').reduce((sum, t) => sum + t.quantity, 0)
                        }
                    }
                }
            });
        });
    });
};

/**
 * GET TIMELINE SUMMARY
 * Get timeline summary for multiple products or warehouses
 */
exports.getTimelineSummary = (req, res) => {
    const { warehouse, dateFrom, dateTo, groupBy = 'product' } = req.query;

    const filters = [];
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

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    let groupByClause, selectClause;
    if (groupBy === 'warehouse') {
        groupByClause = 'GROUP BY location_code';
        selectClause = 'location_code as group_key, location_code as warehouse';
    } else {
        groupByClause = 'GROUP BY barcode, product_name';
        selectClause = 'barcode as group_key, product_name, barcode';
    }

    const sql = `
        SELECT 
            ${selectClause},
            COUNT(*) as total_movements,
            SUM(CASE WHEN direction = 'IN' THEN qty ELSE 0 END) as total_in,
            SUM(CASE WHEN direction = 'OUT' THEN qty ELSE 0 END) as total_out,
            MAX(event_time) as last_movement
        FROM inventory_ledger_base 
        ${whereClause}
        ${groupByClause}
        ORDER BY last_movement DESC
        LIMIT 100
    `;

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('❌ Timeline summary error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            data: results.map(item => ({
                ...item,
                net_movement: item.total_in - item.total_out
            }))
        });
    });
};

/**
 * Helper function to generate timeline descriptions
 */
function getTimelineDescription(item) {
    const qty = item.quantity;
    const type = item.type.toLowerCase();
    
    switch (type) {
        case 'bulk_upload':
            return `Added ${qty} units via bulk upload`;
        case 'dispatch':
            return `Dispatched ${qty} units`;
        case 'damage':
            return `Reported ${qty} units as damaged`;
        case 'recover':
            return `Recovered ${qty} units from damage`;
        case 'return':
            return `Returned ${qty} units to inventory`;
        case 'self_transfer':
            return `Self Transfer: ${qty} units (${item.direction})`;
        case 'opening':
            return `Opening stock: ${qty} units`;
        case 'purchase':
            return `Purchased ${qty} units`;
        default:
            return `${type}: ${qty} units (${item.direction})`;
    }
}

module.exports = exports;