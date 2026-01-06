const mysql = require('mysql2');

// Database configuration
const dbConfig = {
    host: 'inventory-db.cv2iey8a8hbk.ap-south-1.rds.amazonaws.com',
    user: 'admin',
    password: 'gfx998sd',
    database: 'inventory',
    port: 3306,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    multipleStatements: true
};

// Create connection pool for better performance
const pool = mysql.createPool(dbConfig);

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('💡 Connection refused - check if database server is running');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Access denied - check username and password');
        } else if (err.code === 'ENOTFOUND') {
            console.error('💡 Host not found - check database host address');
        }
    } else {
        console.log('✅ Database connected successfully');
        connection.release();
    }
});

// Handle connection errors
pool.on('error', (err) => {
    console.error('Database pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Database connection was closed. Reconnecting...');
    }
});

module.exports = pool;