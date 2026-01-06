// Test backend authentication
// Run with: node test-backend-auth.js

const axios = require('axios');

const API_BASE = 'https://13-201-222-24.nip.io/api';

async function testBackendAuth() {
    console.log('🔐 Testing Backend Authentication...\n');
    
    try {
        // Step 1: Login
        console.log('1. Testing login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@example.com',
            password: 'password123'
        });
        
        if (loginResponse.data.success && loginResponse.data.token) {
            console.log('✅ Login successful!');
            console.log('User:', loginResponse.data.user.name);
            console.log('Role:', loginResponse.data.user.role);
            console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');
            
            const token = loginResponse.data.token;
            
            // Step 2: Test protected endpoints
            console.log('\n2. Testing protected endpoints...');
            
            const endpoints = [
                { name: 'Users', url: '/users' },
                { name: 'Roles', url: '/roles' },
                { name: 'Permissions', url: '/permissions' },
                { name: 'System Stats', url: '/system/stats' }
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await axios.get(`${API_BASE}${endpoint.url}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log(`✅ ${endpoint.name}: ${response.data.data?.length || 'OK'}`);
                } catch (error) {
                    console.log(`❌ ${endpoint.name}: ${error.response?.status} - ${error.response?.data?.message}`);
                }
            }
            
        } else {
            console.log('❌ Login failed - no token received');
        }
        
    } catch (error) {
        console.log('❌ Login failed');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message);
        
        if (error.response?.status === 500) {
            console.log('\n🔍 Server error - check:');
            console.log('1. Is your server running?');
            console.log('2. Are the permissions routes configured?');
            console.log('3. Is the test user set up correctly?');
        }
    }
}

testBackendAuth();