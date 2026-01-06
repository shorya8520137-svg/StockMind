// Setup script for permissions system
// Run with: node setup-permissions.js

const bcrypt = require('bcrypt');
const db = require('./db/connection');

async function setupPermissionsSystem() {
    console.log('🔧 Setting up Permissions System...\n');
    
    try {
        // Step 1: Check if tables exist
        console.log('1. Checking database tables...');
        
        const [tables] = await db.execute("SHOW TABLES LIKE 'users'");
        if (tables.length === 0) {
            console.log('❌ Users table not found. Please run the SQL setup first.');
            return;
        }
        
        const [roles] = await db.execute("SHOW TABLES LIKE 'roles'");
        if (roles.length === 0) {
            console.log('❌ Roles table not found. Please run the SQL setup first.');
            return;
        }
        
        const [permissions] = await db.execute("SHOW TABLES LIKE 'permissions'");
        if (permissions.length === 0) {
            console.log('❌ Permissions table not found. Please run the SQL setup first.');
            return;
        }
        
        console.log('✅ All required tables found');
        
        // Step 2: Check if users table has required columns
        console.log('\n2. Checking users table structure...');
        
        const [columns] = await db.execute("DESCRIBE users");
        const columnNames = columns.map(col => col.Field);
        
        const requiredColumns = ['id', 'name', 'email', 'password_hash', 'role_id'];
        const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
        
        if (missingColumns.length > 0) {
            console.log('❌ Missing columns in users table:', missingColumns.join(', '));
            console.log('Please run the fix-users-table.sql script first.');
            return;
        }
        
        console.log('✅ Users table structure is correct');
        
        // Step 3: Check if SUPER_ADMIN role exists
        console.log('\n3. Checking for SUPER_ADMIN role...');
        
        const [adminRoles] = await db.execute('SELECT id FROM roles WHERE name = "SUPER_ADMIN"');
        if (adminRoles.length === 0) {
            console.log('❌ SUPER_ADMIN role not found. Please run the SQL setup first.');
            return;
        }
        
        const adminRoleId = adminRoles[0].id;
        console.log('✅ SUPER_ADMIN role found with ID:', adminRoleId);
        
        // Step 4: Create test user
        console.log('\n4. Creating test user...');
        
        const testEmail = 'admin@test.com';
        const testPassword = 'password123';
        
        // Check if user already exists
        const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [testEmail]);
        
        if (existingUsers.length > 0) {
            console.log('⚠️  Test user already exists. Updating password...');
            
            const passwordHash = await bcrypt.hash(testPassword, 10);
            await db.execute('UPDATE users SET password_hash = ?, role_id = ? WHERE email = ?', 
                [passwordHash, adminRoleId, testEmail]);
            
            console.log('✅ Test user password updated');
        } else {
            const passwordHash = await bcrypt.hash(testPassword, 10);
            
            await db.execute(`
                INSERT INTO users (name, email, password_hash, role_id)
                VALUES (?, ?, ?, ?)
            `, ['Test Admin', testEmail, passwordHash, adminRoleId]);
            
            console.log('✅ Test user created');
        }
        
        // Step 5: Verify permissions count
        console.log('\n5. Checking permissions...');
        
        const [permCount] = await db.execute('SELECT COUNT(*) as count FROM permissions');
        console.log(`✅ Found ${permCount[0].count} permissions in database`);
        
        const [rolePermCount] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM role_permissions rp 
            JOIN roles r ON rp.role_id = r.id 
            WHERE r.name = "SUPER_ADMIN"
        `);
        console.log(`✅ SUPER_ADMIN has ${rolePermCount[0].count} permissions`);
        
        // Step 6: Test login
        console.log('\n6. Testing login...');
        
        const axios = require('axios');
        const API_BASE = 'https://13-201-222-24.nip.io/api';
        
        try {
            const response = await axios.post(`${API_BASE}/auth/login`, {
                email: testEmail,
                password: testPassword
            });
            
            console.log('✅ Login successful!');
            console.log('User:', response.data.user?.name);
            console.log('Role:', response.data.user?.role);
            console.log('Permissions:', response.data.user?.permissions?.length);
            
        } catch (error) {
            console.log('❌ Login test failed:', error.response?.data?.message || error.message);
            console.log('This might be because the server is not running or routes are not properly configured.');
        }
        
        console.log('\n🎉 Permissions system setup completed!');
        console.log('\n📝 Test Credentials:');
        console.log('Email: admin@test.com');
        console.log('Password: password123');
        console.log('Role: SUPER_ADMIN');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

// Run setup
setupPermissionsSystem();