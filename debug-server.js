// Debug script to check server status and routes
// Run with: node debug-server.js

const axios = require('axios');

const API_BASE = 'https://13-201-222-24.nip.io/api';

async function debugServer() {
    console.log('🔍 Debugging Server Status...\n');
    
    try {
        // Test 1: Check if server is running
        console.log('1. Testing server health check...');
        try {
            const response = await axios.get('https://13-201-222-24.nip.io/');
            console.log('✅ Server is running');
            console.log('Response:', response.data);
        } catch (error) {
            console.log('❌ Server health check failed:', error.code);
            console.log('This means your server is not running or not accessible');
            return;
        }
        
        // Test 2: Check existing API endpoints
        console.log('\n2. Testing existing API endpoints...');
        try {
            const response = await axios.get(`${API_BASE}/inventory`);
            console.log('✅ Existing API endpoints are working');
        } catch (error) {
            console.log('⚠️  Existing API endpoints error:', error.response?.status || error.code);
        }
        
        // Test 3: Check if permissions routes are loaded
        console.log('\n3. Testing permissions routes...');
        try {
            const response = await axios.get(`${API_BASE}/roles`);
            console.log('❌ This should have failed with 401, but got:', response.status);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Permissions routes are loaded (got 401 as expected)');
            } else if (error.response?.status === 404) {
                console.log('❌ Permissions routes not found (404) - routes not configured');
            } else if (error.response?.status === 502) {
                console.log('❌ Bad Gateway (502) - server configuration issue');
            } else {
                console.log('❌ Unexpected error:', error.response?.status || error.code);
            }
        }
        
        // Test 4: Check specific auth endpoint
        console.log('\n4. Testing auth endpoint...');
        try {
            const response = await axios.post(`${API_BASE}/auth/login`, {
                email: 'test@test.com',
                password: 'test'
            });
            console.log('❌ This should have failed, but got:', response.status);
        } catch (error) {
            if (error.response?.status === 400 || error.response?.status === 401) {
                console.log('✅ Auth endpoint is working (got expected error)');
            } else if (error.response?.status === 404) {
                console.log('❌ Auth endpoint not found (404) - routes not configured');
            } else if (error.response?.status === 502) {
                console.log('❌ Bad Gateway (502) - server configuration issue');
            } else {
                console.log('❌ Unexpected error:', error.response?.status || error.code);
            }
        }
        
        console.log('\n📋 Diagnosis:');
        console.log('If you see 502 errors, it means:');
        console.log('1. Your server might not be running');
        console.log('2. The permissions routes are not added to server.js');
        console.log('3. There might be a syntax error in the route files');
        
        console.log('\n🔧 Next steps:');
        console.log('1. Make sure your server is running: npm start');
        console.log('2. Check if permissions routes are added to server.js');
        console.log('3. Check server logs for any errors');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

// Run debug
debugServer();