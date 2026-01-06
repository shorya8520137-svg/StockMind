// Debug login issues
// Run with: node debug-login.js

const db = require('./db/connection');
const bcrypt = require('bcrypt');

async function debugLogin() {
    console.log('🔍 Debugging Login Issues...\n');
    
    try {
        // Step 1: Test database connection
        console.log('1. Testing database connection...');
        await db.execute('SELECT 1');
        console.log('✅ Database connection successful');
        
        // Step 2: Check if bcrypt is available
        console.log('\n2. Testing bcrypt...');
        const testHash = await bcrypt.hash('test123', 10);
        const testVerify = await bcrypt.compare('test123', testHash);
        console.log('✅ bcrypt working:', testVerify);
        
        // Step 3: Check if test user exists
        console.log('\n3. Checking test user...');
        const [users] = await db.execute(`
            SELECT u.*, r.name as role_name, r.display_name as role_display_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = ?
        `, ['admin@example.com']);
        
        if (users.length === 0) {
            console.log('❌ Test user not found');
            console.log('Creating test user...');
            
            // Get super_admin role
            const [roles] = await db.execute('SELECT id FROM roles WHERE name = "super_admin"');
            if (roles.length === 0) {
                console.log('❌ super_admin role not found');
                return;
            }
            
            // Create test user
            await db.execute(`
                UPDATE users 
                SET role_id = ?, password = 'password123', name = 'Test Admin'
                WHERE email = 'admin@example.com'
            `, [roles[0].id]);
            
            console.log('✅ Test user created/updated');
        } else {
            const user = users[0];
            console.log('✅ Test user found:');
            console.log('  Name:', user.name);
            console.log('  Email:', user.email);
            console.log('  Role:', user.role_name);
            console.log('  Has password:', user.password ? 'Yes' : 'No');
            console.log('  Has password_hash:', user.password_hash ? 'Yes' : 'No');
        }
        
        // Step 4: Test password verification
        console.log('\n4. Testing password verification...');
        const [testUsers] = await db.execute(`
            SELECT * FROM users WHERE email = ?
        `, ['admin@example.com']);
        
        if (testUsers.length > 0) {
            const user = testUsers[0];
            let isValid = false;
            
            if (user.password_hash) {
                isValid = await bcrypt.compare('password123', user.password_hash);
                console.log('✅ Password hash verification:', isValid);
            } else if (user.password) {
                isValid = (user.password === 'password123');
                console.log('✅ Plain text password verification:', isValid);
            } else {
                console.log('❌ No password found');
            }
        }
        
        // Step 5: Test the actual login logic
        console.log('\n5. Testing login logic...');
        const email = 'admin@example.com';
        const password = 'password123';
        
        const [loginUsers] = await db.execute(`
            SELECT u.*, r.name as role_name, r.display_name as role_display_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = ?
        `, [email]);
        
        if (loginUsers.length === 0) {
            console.log('❌ User not found during login test');
            return;
        }
        
        const user = loginUsers[0];
        
        // Verify password
        let isValidPassword = false;
        if (user.password_hash) {
            isValidPassword = await bcrypt.compare(password, user.password_hash);
        } else if (user.password) {
            isValidPassword = (password === user.password);
        }
        
        console.log('✅ Login test result:', isValidPassword);
        
        if (isValidPassword) {
            // Get user permissions
            const [permissions] = await db.execute(`
                SELECT p.name, p.display_name, p.category
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ? AND p.is_active = true
            `, [user.role_id]);
            
            console.log('✅ User permissions:', permissions.length);
            
            console.log('\n🎉 Login should work! User data:');
            console.log({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role_name,
                permissions: permissions.length
            });
        } else {
            console.log('❌ Password verification failed');
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

debugLogin();