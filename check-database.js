// Check database structure and data
// Run with: node check-database.js

const db = require('./db/connection');

async function checkDatabase() {
    console.log('🗄️  Checking Database Structure...\n');
    
    try {
        // Check 1: Test database connection
        console.log('1. Testing database connection...');
        await db.execute('SELECT 1');
        console.log('✅ Database connection successful');
        
        // Check 2: Check if required tables exist
        console.log('\n2. Checking required tables...');
        
        const requiredTables = ['users', 'roles', 'permissions', 'role_permissions'];
        
        for (const table of requiredTables) {
            try {
                const result = await db.execute(`SHOW TABLES LIKE '${table}'`);
                const rows = Array.isArray(result) ? result[0] : result;
                if (rows && rows.length > 0) {
                    console.log(`✅ Table '${table}' exists`);
                } else {
                    console.log(`❌ Table '${table}' missing`);
                }
            } catch (error) {
                console.log(`❌ Error checking table '${table}':`, error.message);
            }
        }
        
        // Check 3: Check users table structure
        console.log('\n3. Checking users table structure...');
        
        try {
            const result = await db.execute('DESCRIBE users');
            const columns = Array.isArray(result) ? result[0] : result;
            console.log('Users table columns:');
            columns.forEach(col => {
                console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
            });
            
            // Check for required columns
            const columnNames = columns.map(col => col.Field);
            const requiredColumns = ['id', 'name', 'email', 'password_hash', 'role_id'];
            
            const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
            if (missingColumns.length > 0) {
                console.log('❌ Missing required columns:', missingColumns.join(', '));
            } else {
                console.log('✅ All required columns present');
            }
            
        } catch (error) {
            console.log('❌ Error checking users table:', error.message);
        }
        
        // Check 4: Check if roles exist
        console.log('\n4. Checking roles...');
        
        try {
            const result = await db.execute('SELECT id, name, display_name FROM roles');
            const roles = Array.isArray(result) ? result[0] : result;
            if (roles && roles.length > 0) {
                console.log('Available roles:');
                roles.forEach(role => {
                    console.log(`  - ${role.name} (ID: ${role.id}) - ${role.display_name}`);
                });
            } else {
                console.log('❌ No roles found in database');
            }
        } catch (error) {
            console.log('❌ Error checking roles:', error.message);
        }
        
        // Check 5: Check existing users
        console.log('\n5. Checking existing users...');
        
        try {
            const result = await db.execute(`
                SELECT u.id, u.name, u.email, u.role_id, r.name as role_name,
                       CASE WHEN u.password_hash IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                LIMIT 5
            `);
            const users = Array.isArray(result) ? result[0] : result;
            
            if (users && users.length > 0) {
                console.log('Existing users:');
                users.forEach(user => {
                    console.log(`  - ${user.name} (${user.email}) - Role: ${user.role_name || 'No role'} - ${user.password_status}`);
                });
            } else {
                console.log('❌ No users found in database');
            }
        } catch (error) {
            console.log('❌ Error checking users:', error.message);
        }
        
        // Check 6: Check permissions count
        console.log('\n6. Checking permissions...');
        
        try {
            const result = await db.execute('SELECT COUNT(*) as count FROM permissions');
            const permCount = Array.isArray(result) ? result[0] : result;
            const count = permCount[0] ? permCount[0].count : permCount.count;
            console.log(`✅ Found ${count} permissions in database`);
            
            if (count === 0) {
                console.log('❌ No permissions found. Run the SQL setup script.');
            }
        } catch (error) {
            console.log('❌ Error checking permissions:', error.message);
        }
        
        console.log('\n📋 Summary:');
        console.log('If you see any ❌ errors above, those need to be fixed first.');
        console.log('Most likely issues:');
        console.log('1. Missing password_hash column in users table');
        console.log('2. No test user with proper password hash');
        console.log('3. Missing roles or permissions data');
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    } finally {
        process.exit(0);
    }
}

// Run check
checkDatabase();