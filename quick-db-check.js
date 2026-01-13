const mysql = require('mysql2');

// Test both databases to see which one works
const databases = [
    {
        name: 'inventory',
        config: {
            host: 'inventory-db.cv2iey8a8hbk.ap-south-1.rds.amazonaws.com',
            user: 'admin',
            password: 'gfx998sd',
            database: 'inventory',
            port: 3306,
            connectTimeout: 10000
        }
    },
    {
        name: 'hunyhuny_auto_dispatch',
        config: {
            host: 'inventory-db.cv2iey8a8hbk.ap-south-1.rds.amazonaws.com',
            user: 'admin',
            password: 'gfx998sd',
            database: 'hunyhuny_auto_dispatch',
            port: 3306,
            connectTimeout: 10000
        }
    }
];

async function testDatabase(dbInfo) {
    return new Promise((resolve) => {
        console.log(`\n🔍 Testing ${dbInfo.name} database...`);
        
        const connection = mysql.createConnection(dbInfo.config);
        
        connection.connect((err) => {
            if (err) {
                console.log(`❌ ${dbInfo.name}: ${err.message}`);
                resolve({ name: dbInfo.name, success: false, error: err.message });
            } else {
                console.log(`✅ ${dbInfo.name}: Connected successfully`);
                
                // Test a simple query
                connection.query('SHOW TABLES', (err, results) => {
                    if (err) {
                        console.log(`❌ ${dbInfo.name}: Query failed - ${err.message}`);
                        resolve({ name: dbInfo.name, success: false, error: err.message });
                    } else {
                        console.log(`📋 ${dbInfo.name}: Found ${results.length} tables`);
                        resolve({ name: dbInfo.name, success: true, tables: results.length });
                    }
                    connection.end();
                });
            }
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
            connection.destroy();
            console.log(`⏰ ${dbInfo.name}: Connection timeout`);
            resolve({ name: dbInfo.name, success: false, error: 'Timeout' });
        }, 10000);
    });
}

async function main() {
    console.log('🧪 Testing database connections...');
    
    const results = [];
    for (const db of databases) {
        const result = await testDatabase(db);
        results.push(result);
    }
    
    console.log('\n📊 Summary:');
    results.forEach(result => {
        if (result.success) {
            console.log(`✅ ${result.name}: Working (${result.tables} tables)`);
        } else {
            console.log(`❌ ${result.name}: Failed - ${result.error}`);
        }
    });
    
    const workingDb = results.find(r => r.success);
    if (workingDb) {
        console.log(`\n🎯 Recommendation: Use "${workingDb.name}" database`);
    } else {
        console.log('\n⚠️ No databases are accessible. Check network/credentials.');
    }
}

main();