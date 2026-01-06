// Test script for permissions system
// Run with: node test-permissions.js

const axios = require('axios');

const API_BASE = 'https://13-201-222-24.nip.io/api';

async function testPermissionsSystem() {
    console.log('🧪 Testing Permissions System...\n');
    
    try {
        // Test 1: Get all roles
        console.log('1. Testing GET /api/roles (should fail without auth)');
        try {
            const response = await axios.get(`${API_BASE}/roles`);
            console.log('❌ Should have failed without authentication');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly rejected without authentication');
            } else {
                console.log('❌ Unexpected error:', error.response?.status);
            }
        }
        
        // Test 2: Get all permissions
        console.log('\n2. Testing GET /api/permissions (should fail without auth)');
        try {
            const response = await axios.get(`${API_BASE}/permissions`);
            console.log('❌ Should have failed without authentication');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly rejected without authentication');
            } else {
                console.log('❌ Unexpected error:', error.response?.status);
            }
        }
        
        // Test 3: Login attempt (will fail without user in database)
        console.log('\n3. Testing POST /api/auth/login');
        try {
            const response = await axios.post(`${API_BASE}/auth/login`, {
                email: 'admin@test.com',
                password: 'password123'
            });
            console.log('✅ Login successful:', response.data.user?.name);
            
            const token = response.data.token;
            
            // Test 4: Get roles with authentication
            console.log('\n4. Testing GET /api/roles (with auth)');
            const rolesResponse = await axios.get(`${API_BASE}/roles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Roles fetched:', rolesResponse.data.data?.length, 'roles');
            
            // Test 5: Get permissions with authentication
            console.log('\n5. Testing GET /api/permissions (with auth)');
            const permissionsResponse = await axios.get(`${API_BASE}/permissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Permissions fetched:', permissionsResponse.data.data?.permissions?.length, 'permissions');
            
            // Test 6: Get system stats
            console.log('\n6. Testing GET /api/system/stats (with auth)');
            const statsResponse = await axios.get(`${API_BASE}/system/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ System stats:', statsResponse.data.data);
            
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('⚠️  No test user found. Create a user first:');
                console.log('   INSERT INTO users (name, email, password_hash, role_id) VALUES');
                console.log('   ("Test Admin", "admin@test.com", "$2b$10$hash", 1);');
            } else {
                console.log('❌ Login failed:', error.response?.data?.message);
            }
        }
        
        console.log('\n🎉 Permissions system test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Helper function to create a test user
async function createTestUser() {
    console.log('🔧 Creating test user...\n');
    
    const bcrypt = require('bcrypt');
    const db = require('./db/connection');
    
    try {
        // Hash password
        const passwordHash = await bcrypt.hash('password123', 10);
        
        // Get SUPER_ADMIN role ID
        const [roles] = await db.execute('SELECT id FROM roles WHERE name = "SUPER_ADMIN"');
        if (roles.length === 0) {
            console.log('❌ SUPER_ADMIN role not found. Run the SQL setup first.');
            return;
        }
        
        const roleId = roles[0].id;
        
        // Create test user
        await db.execute(`
            INSERT IGNORE INTO users (name, email, password_hash, role_id, status)
            VALUES (?, ?, ?, ?, ?)
        `, ['Test Admin', 'admin@test.com', passwordHash, roleId, 'active']);
        
        console.log('✅ Test user created:');
        console.log('   Email: admin@test.com');
        console.log('   Password: password123');
        console.log('   Role: SUPER_ADMIN\n');
        
        // Now run the tests
        await testPermissionsSystem();
        
    } catch (error) {
        console.error('❌ Failed to create test user:', error.message);
    }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--create-user')) {
    createTestUser();
} else {
    testPermissionsSystem();
}

// Usage instructions
if (args.length === 0) {
    console.log('\n📝 Usage:');
    console.log('   node test-permissions.js              # Test with existing user');
    console.log('   node test-permissions.js --create-user # Create test user and run tests');
}