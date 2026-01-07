const db = require('../db/connection');

/**
 * =====================================================
 * DASHBOARD CONTROLLER - Analytics and KPIs
 * Based on existing database tables:
 * - warehouse_dispatch (orders/dispatches)
 * - stock_batches (inventory)
 * - inventory_ledger_base (movements)
 * - damage_recovery_log (damages)
 * =====================================================
 */

/**
 * GET DASHBOARD KPIs
 * Returns key performance indicators
 */
exports.getKPIs = (req, res) => {
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
            COUNT(*) as dispatches,
            SUM(COALESCE(invoice_amount, 0)) as revenue,
            SUM(COALESCE(qty, 0)) as total_quantity,
            COUNT(CASE WHEN status = 'Delivered' THEN 1 END) as delivered_count,
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
            AVG(COALESCE(invoice_amount, 0)) as avg_order_value
        FROM warehouse_dispatch 
        ${whereClause}
    `;
    
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('❌ KPIs query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
        
        const data = results[0] || {};
        
        // Calculate estimated cost (70% of revenue as example)
        const revenue = parseFloat(data.revenue) || 0;
        const cost = revenue * 0.7;
        const profit = revenue - cost;
        
        res.json({
            dispatches: parseInt(data.dispatches) || 0,
            revenue: Math.round(revenue),
            cost: Math.round(cost),
            profit: Math.round(profit),
            total_quantity: parseInt(data.total_quantity) || 0,
            delivered_count: parseInt(data.delivered_count) || 0,
            pending_count: parseInt(data.pending_count) || 0,
            avg_order_value: Math.round(parseFloat(data.avg_order_value) || 0)
        });
    });
};

/**
 * GET REVENUE VS COST CHART DATA
 * Returns time series data for line chart
 */
exports.getRevenueCost = (req, res) => {
    const { warehouse, days = 7 } = req.query;
    
    const filters = [];
    const values = [];
    
    if (warehouse) {
        filters.push('warehouse = ?');
        values.push(warehouse);
    }
    
    // Get data for last N days
    filters.push('timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)');
    values.push(parseInt(days));
    
    const whereClause = `WHERE ${filters.join(' AND ')}`;
    
    const sql = `
        SELECT 
            DATE(timestamp) as date,
            SUM(COALESCE(invoice_amount, 0)) as revenue,
            COUNT(*) as orders
        FROM warehouse_dispatch 
        ${whereClause}
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
    `;
    
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('❌ Revenue-Cost query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
        
        const data = results.map(row => {
            const revenue = parseFloat(row.revenue) || 0;
            const cost = revenue * 0.7; // Estimated cost
            
            return {
                label: new Date(row.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                }),
                revenue: Math.round(revenue),
                cost: Math.round(cost),
                orders: parseInt(row.orders)
            };
        });
        
        res.json(data);
    });
};

/**
 * GET WAREHOUSE VOLUME DATA
 * Returns volume data per warehouse for bar chart
 */
exports.getWarehouseVolume = (req, res) => {
    const { dateFrom, dateTo } = req.query;
    
    const filters = [];
    const values = [];
    
    if (dateFrom) {
        filters.push('timestamp >= ?');
        values.push(`${dateFrom} 00:00:00`);
    }
    
    if (dateTo) {
        filters.push('timestamp <= ?');
        values.push(`${dateTo} 23:59:59`);
    } else {
        // Default to last 30 days
        filters.push('timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
    }
    
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    
    const sql = `
        SELECT 
            warehouse,
            COUNT(*) as count,
            SUM(COALESCE(qty, 0)) as total_quantity,
            SUM(COALESCE(invoice_amount, 0)) as total_amount
        FROM warehouse_dispatch 
        ${whereClause}
        GROUP BY warehouse
        ORDER BY count DESC
        LIMIT 10
    `;
    
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('❌ Warehouse volume query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
        
        const data = results.map(row => ({
            warehouse: row.warehouse,
            count: parseInt(row.count),
            total_quantity: parseInt(row.total_quantity) || 0,
            total_amount: Math.round(parseFloat(row.total_amount) || 0)
        }));
        
        res.json(data);
    });
};

/**
 * GET ACTIVITY FEED
 * Returns recent activity messages
 */
exports.getActivity = (req, res) => {
    const { limit = 10 } = req.query;
    
    const sql = `
        SELECT 
            'dispatch' as type,
            id,
            timestamp,
            CONCAT('Dispatch #', id, ' - ', customer, ' (', warehouse, ')') as message,
            warehouse,
            status
        FROM warehouse_dispatch 
        ORDER BY timestamp DESC
        LIMIT ?
        
        UNION ALL
        
        SELECT 
            'damage' as type,
            id,
            timestamp,
            CONCAT('Damage reported: ', product_type, ' (', quantity, ' units)') as message,
            inventory_location as warehouse,
            'Reported' as status
        FROM damage_recovery_log 
        WHERE action_type = 'damage'
        ORDER BY timestamp DESC
        LIMIT ?
        
        ORDER BY timestamp DESC
        LIMIT ?
    `;
    
    db.query(sql, [parseInt(limit), parseInt(limit), parseInt(limit)], (err, results) => {
        if (err) {
            console.error('❌ Activity query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
        
        const data = results.map(row => ({
            type: row.type,
            message: row.message,
            timestamp: row.timestamp,
            warehouse: row.warehouse,
            status: row.status
        }));
        
        res.json(data);
    });
};

/**
 * GET DISPATCH HEATMAP DATA
 * Returns heatmap matrix for activity visualization
 */
exports.getDispatchHeatmap = (req, res) => {
    const { range = 'week' } = req.query;
    
    let dateFilter = '';
    let days = 7;
    
    switch (range) {
        case 'week':
            dateFilter = 'timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
            days = 7;
            break;
        case 'last':
            dateFilter = 'timestamp >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND timestamp < DATE_SUB(NOW(), INTERVAL 7 DAY)';
            days = 7;
            break;
        case 'month':
            dateFilter = 'timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
            days = 30;
            break;
        default:
            dateFilter = 'timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
            days = 7;
    }
    
    const sql = `
        SELECT 
            DAYOFWEEK(timestamp) as day_of_week,
            HOUR(timestamp) as hour_of_day,
            COUNT(*) as activity_count
        FROM warehouse_dispatch 
        WHERE ${dateFilter}
        GROUP BY DAYOFWEEK(timestamp), HOUR(timestamp)
        ORDER BY day_of_week, hour_of_day
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Heatmap query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
        
        // Create 7x24 matrix (7 days, 24 hours)
        const matrix = Array(7).fill().map(() => Array(24).fill(0));
        let maxValue = 0;
        
        results.forEach(row => {
            const dayIndex = (row.day_of_week - 1) % 7; // Convert to 0-6 (Sunday = 0)
            const hourIndex = row.hour_of_day;
            const count = parseInt(row.activity_count);
            
            matrix[dayIndex][hourIndex] = count;
            maxValue = Math.max(maxValue, count);
        });
        
        res.json({
            matrix,
            max: maxValue,
            range,
            days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            hours: Array.from({length: 24}, (_, i) => i)
        });
    });
};

/**
 * GET INVENTORY SUMMARY
 * Returns inventory statistics
 */
exports.getInventorySummary = (req, res) => {
    const { warehouse } = req.query;
    
    const filters = ["status = 'active'"];
    const values = [];
    
    if (warehouse) {
        filters.push('warehouse = ?');
        values.push(warehouse);
    }
    
    const whereClause = `WHERE ${filters.join(' AND ')}`;
    
    const sql = `
        SELECT 
            COUNT(DISTINCT barcode) as unique_products,
            SUM(qty_available) as total_stock,
            COUNT(CASE WHEN qty_available > 0 AND qty_available <= 10 THEN 1 END) as low_stock_items,
            COUNT(CASE WHEN qty_available = 0 THEN 1 END) as out_of_stock_items,
            warehouse
        FROM stock_batches 
        ${whereClause}
        GROUP BY warehouse
        ORDER BY total_stock DESC
    `;
    
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('❌ Inventory summary query error:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }
        
        res.json({
            success: true,
            data: results
        });
    });
};

module.exports = exports;