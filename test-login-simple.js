// Simple login test for your existing database
// Run with: node test-login-simple.js

const axios = require('axios');

const API_BASE = 'https://13-201-222-24.nip.io/api';

async function testLogin() {
    console.log('🔐 Testing Login with Your Database...\n');
    
    try {
        console.log('Testing login with admin@example.com / password123');
        
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@example.com',
            password: 'password123'
        });
        
        console.log('✅ Login successful!');
        console.log('User:', response.data.user?.name);
        console.log('Email:', response.data.user?.email);
        console.log('Role:', response.data.user?.role);
        console.log('Permissions count:', response.data.user?.permissions?.length);
        console.log('Token received:', response.data.token ? 'Yes' : 'No');
        
        // Test authenticated request
        console.log('\n🔒 Testing authenticated request...');
        
        const rolesResponse = await axios.get(`${API_BASE}/roles`, {
            headers: { Authorization: `Bearer ${response.data.token}` }
        });
        
        console.log('✅ Authenticated request successful!');
        console.log('Roles found:', rolesResponse.data.data?.length);
        
    } catch (error) {
        console.log('❌ Login failed');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message);
        console.log('Full error:', error.response?.data);
        
        if (error.response?.status === 500) {
            console.log('\n🔍 This is likely a server-side error. Check:');
            console.log('1. Database connection');
            console.log('2. bcrypt package installed');
            console.log('3. Server logs for detailed error');
        }
    }
}

testLogin();