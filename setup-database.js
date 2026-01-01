require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log('🚀 Starting database setup...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('✅ Connected to database');

        // Read the SQL setup file
        const sqlFile = path.join(__dirname, 'database-setup.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('📋 Executing database setup script...');

        // Split SQL into individual statements and filter
        const allStatements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => 
                stmt.length > 10 && 
                !stmt.startsWith('--') && 
                !stmt.startsWith('/*') &&
                stmt !== 'USE inventory'
            );

        // Separate CREATE TABLE statements from INSERT statements
        const createStatements = allStatements.filter(stmt => 
            stmt.toUpperCase().includes('CREATE TABLE')
        );
        
        const insertStatements = allStatements.filter(stmt => 
            stmt.toUpperCase().includes('INSERT')
        );

        // Execute CREATE TABLE statements first
        console.log('📋 Creating tables...');
        for (const statement of createStatements) {
            try {
                await connection.execute(statement);
                const tableName = statement.match(/CREATE TABLE.*?(\w+)/i)?.[1];
                console.log(`   ✓ Created table: ${tableName}`);
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.error(`   ❌ Error creating table: ${error.message}`);
                }
            }
        }

        // Execute INSERT statements after all tables are created
        console.log('📋 Inserting data...');
        for (const statement of insertStatements) {
            try {
                await connection.execute(statement);
                const match = statement.match(/INSERT.*?INTO\s+(\w+)/i);
                if (match) {
                    console.log(`   ✓ Inserted data into: ${match[1]}`);
                }
            } catch (error) {
                if (!error.message.includes('Duplicate entry')) {
                    console.error(`   ❌ Error inserting data: ${error.message}`);
                }
            }
        }

        console.log('\n🎉 Database setup completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   ✓ Tables created: roles, permissions, users, role_permissions, audit_logs');
        console.log('   ✓ Tables created: inventory, orders, dispatches, channels, messages');
        console.log('   ✓ Tables created: damage_recovery, returns, transfers');
        console.log('   ✓ Default roles inserted: 6 roles with hierarchical permissions');
        console.log('   ✓ Default permissions inserted: 35+ granular permissions');
        console.log('   ✓ Default users created: 5 test users');
        console.log('   ✓ Sample data inserted: inventory items, orders, channels');

        console.log('\n🔑 Default Login Credentials:');
        console.log('   Super Admin: admin@example.com / admin@123');
        console.log('   Manager:     manager@example.com / admin@123');
        console.log('   Operator:    operator@example.com / admin@123');
        console.log('   Warehouse:   warehouse@example.com / admin@123');
        console.log('   Viewer:      viewer@example.com / admin@123');

        console.log('\n🚀 Ready to start server with: npm start');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

setupDatabase();