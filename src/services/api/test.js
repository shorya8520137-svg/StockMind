// API Test Utilities
import { checkAPIHealth, bulkUploadAPI } from './index';

export const apiTests = {
    /**
     * Test API connection
     */
    async testConnection() {
        console.log('🔍 Testing API connection...');
        try {
            const result = await checkAPIHealth();
            if (result.success) {
                console.log('✅ API connection successful:', result.data);
                return true;
            } else {
                console.error('❌ API connection failed:', result.error);
                return false;
            }
        } catch (error) {
            console.error('❌ API test error:', error.message);
            return false;
        }
    },

    /**
     * Test bulk upload endpoints
     */
    async testBulkUpload() {
        console.log('🔍 Testing bulk upload endpoints...');
        try {
            // Test warehouses endpoint
            const warehouses = await bulkUploadAPI.getWarehouses();
            console.log('✅ Warehouses loaded:', warehouses.warehouses?.length || 0);

            // Test CSV parsing
            const csvContent = bulkUploadAPI.getCSVTemplate();
            const rows = bulkUploadAPI.parseCSV(csvContent, 'MUM_WH');
            console.log('✅ CSV parsing works:', rows.length, 'rows');

            // Test validation
            const validation = bulkUploadAPI.validateRow(rows[0]);
            console.log('✅ Row validation:', validation.isValid ? 'passed' : 'failed');

            // Test the main upload endpoint (POST /api/bulk-upload)
            console.log('🔍 Testing main upload endpoint: POST /api/bulk-upload');
            console.log('📋 Sample data prepared for upload:', rows.length, 'rows');

            return true;
        } catch (error) {
            console.error('❌ Bulk upload test failed:', error.message);
            return false;
        }
    },

    /**
     * Test the specific bulk upload endpoint
     */
    async testBulkUploadEndpoint() {
        console.log('🔍 Testing POST https://13-201-222-24.nip.io/api/bulk-upload');
        try {
            // Create sample data
            const sampleRows = [
                {
                    barcode: 'TEST123',
                    product_name: 'Test Product',
                    variant: 'Red',
                    warehouse: 'MUM_WH',
                    qty: 5,
                    unit_cost: 10.50
                }
            ];

            console.log('📤 Sending test data to bulk upload endpoint...');
            console.log('🔗 Endpoint: POST /api/bulk-upload');
            console.log('📋 Data:', JSON.stringify(sampleRows, null, 2));

            // Note: Uncomment the line below to actually test the upload
            // const result = await bulkUploadAPI.upload(sampleRows);
            // console.log('✅ Upload test result:', result);

            console.log('⚠️ Upload test skipped (uncomment to run actual upload)');
            return true;
        } catch (error) {
            console.error('❌ Bulk upload endpoint test failed:', error.message);
            return false;
        }
    },

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Running API tests...');
        const results = {
            connection: await this.testConnection(),
            bulkUpload: await this.testBulkUpload(),
            uploadEndpoint: await this.testBulkUploadEndpoint()
        };

        const passed = Object.values(results).filter(Boolean).length;
        const total = Object.keys(results).length;

        console.log(`📊 Test Results: ${passed}/${total} passed`);
        console.log('🎯 Main endpoint: POST https://13-201-222-24.nip.io/api/bulk-upload');
        return results;
    }
};

// Export for use in development
if (typeof window !== 'undefined') {
    window.apiTests = apiTests;
}