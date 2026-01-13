const axios = require('axios');

async function testDispatchAPI() {
    console.log('🧪 Testing Dispatch API...\n');

    const testData = {
        selectedWarehouse: "BLR_WH",
        orderRef: "TEST-001",
        customerName: "Test Customer",
        awbNumber: "AWB123456",
        selectedLogistics: "BlueDart",
        selectedPaymentMode: "COD",
        parcelType: "Forward",
        selectedExecutive: "Test Executive",
        invoiceAmount: "1500",
        weight: "2.5",
        dimensions: {
            length: "30",
            width: "20",
            height: "10"
        },
        remarks: "Test dispatch",
        products: [
            {
                name: "Test Product | Variant | TEST123",
                qty: 2
            }
        ]
    };

    try {
        console.log('📤 Sending POST request to dispatch API...');
        console.log('🔗 URL: https://api.hunyhuny.org/api/dispatch/create');
        console.log('📦 Data:', JSON.stringify(testData, null, 2));

        const response = await axios.post('https://api.hunyhuny.org/api/dispatch/create', testData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Success! Status:', response.status);
        console.log('📄 Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ Error occurred:');
        console.log('   Status:', error.response?.status || 'No status');
        console.log('   Message:', error.response?.data?.message || error.message);
        console.log('   Full error:', error.response?.data || error.message);
    }
}

testDispatchAPI();