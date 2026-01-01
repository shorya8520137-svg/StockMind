require('dotenv').config();
const mysql = require('mysql2/promise');

async function createDatabase() {
    console.log('🚀 Creating database...\n');

    // Connect without specifying database
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log('✅ Connected to MySQL server');

        // Create database if it doesn't exist
        await connection.execute(`CREATE DATABASE IF NOT EXISTS inventory`);
        console.log('✅ Database "inventory" created or already exists');

        console.log('\n🎉 Database creation completed!');
        console.log('Now run: node setup-database.js');

    } catch (error) {
        console.error('❌ Database creation failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

createDatabase();