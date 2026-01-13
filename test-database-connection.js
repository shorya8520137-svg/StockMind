const db = require('./db/connection');

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...\n');

    try {
        // Test basic connection
        console.log('1. Testing basic connection...');
        const connection = await new Promise((resolve, reject) => {
            db.getConnection((err, conn) => {
                if (err) reject(err);
                else resolve(conn);
            });
        });
        
        console.log('✅ Database connection successful');
        
        // Test current database
        console.log('\n2. Checking current database...');
        const dbResult = await new Promise((resolve, reject) => {
            connection.query('SELECT DATABASE() as current_db, USER() as current_user', (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        console.log('📊 Current database:', dbResult[0].current_db);
        console.log('👤 Current user:', dbResult[0].current_user);
        
        // Test tables
        console.log('\n3. Checking available tables...');
        const tablesResult = await new Promise((resolve, reject) => {
            connection.query('SHOW TABLES', (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        console.log('📋 Available tables:');
        tablesResult.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
        });
        
        // Test a simple query
        console.log('\n4. Testing warehouse_dispatch table...');
        const dispatchResult = await new Promise((resolve, reject) => {
            connection.query('SELECT COUNT(*) as count FROM warehouse_dispatch LIMIT 1', (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        console.log('✅ warehouse_dispatch table accessible, records:', dispatchResult[0].count);
        
        connection.release();
        console.log('\n🎉 All database tests passed!');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        console.error('Error code:', error.code);
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('\n💡 Suggestion: The table might not exist in this database');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Suggestion: Check user permissions');
        } else if (error.message.includes('definer')) {
            console.log('\n💡 Suggestion: Run the fix-database-definer.sql script');
        }
    }
}

testDatabaseConnection();