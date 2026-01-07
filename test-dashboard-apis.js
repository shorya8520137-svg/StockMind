const axios = require('axios');

const API_BASE = 'https://api.hunyhuny.org/api/dashboard';

async function testDashboardAPIs() {
    console.log('🧪 Testing Dashboard APIs...\n');

    const endpoints = [
        { name: 'KPIs', url: `${API_BASE}/kpis` },
        { name: 'Revenue-Cost', url: `${API_BASE}/revenue-cost` },
        { name: 'Warehouse Volume', url: `${API_BASE}/warehouse-volume` },
        { name: 'Activity Feed', url: `${API_BASE}/activity` },
        { name: 'Dispatch Heatmap', url: `${API_BASE}/dispatch-heatmap?range=week` },
        { name: 'Inventory Summary', url: `${API_BASE}/inventory-summary` }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`📊 Testing ${endpoint.name}...`);
            const response = await axios.get(endpoint.url, { timeout: 10000 });
            
            console.log(`✅ ${endpoint.name}: Status ${response.status}`);
            console.log(`📄 Sample data:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...\n');
            
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ${error.response?.status || 'Network Error'}`);
            console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
        }
    }
}

testDashboardAPIs();