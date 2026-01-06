// Test file for inventory API filtering
import { inventoryAPI } from './inventory';

/**
 * Test inventory filtering with the exact API endpoint format
 * Example: /api/inventory?warehouse=GGM_WH&dateFrom=2025-12-01&dateTo=2025-12-31
 */
export async function testInventoryFiltering() {
    console.log('Testing inventory API filtering...');
    
    try {
        // Test 1: Basic warehouse and date filtering
        const filters = {
            warehouse: 'GGM_WH',
            dateFrom: '2025-01-01',
            dateTo: '2025-12-31',
            page: 1,
            limit: 50
        };
        
        console.log('Test 1: Basic filtering');
        console.log('Filters:', filters);
        
        const result = await inventoryAPI.getInventory(filters);
        console.log('API Response:', result);
        
        // Test 2: With search and stock filter
        const advancedFilters = {
            warehouse: 'GGM_WH',
            dateFrom: '2025-01-01',
            dateTo: '2025-12-31',
            search: 'product',
            stockFilter: 'in-stock',
            sortBy: 'product_name',
            sortOrder: 'asc',
            page: 1,
            limit: 50
        };
        
        console.log('Test 2: Advanced filtering');
        console.log('Filters:', advancedFilters);
        
        const advancedResult = await inventoryAPI.getInventory(advancedFilters);
        console.log('Advanced API Response:', advancedResult);
        
        return {
            success: true,
            basicTest: result,
            advancedTest: advancedResult
        };
        
    } catch (error) {
        console.error('Inventory API test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Test specific warehouse filtering
 */
export async function testWarehouseFiltering(warehouseCode = 'GGM_WH') {
    console.log(`Testing warehouse filtering for: ${warehouseCode}`);
    
    try {
        const result = await inventoryAPI.getInventoryByWarehouse(warehouseCode, {
            dateFrom: '2025-01-01',
            dateTo: '2025-12-31'
        });
        
        console.log('Warehouse filtering result:', result);
        return { success: true, data: result };
        
    } catch (error) {
        console.error('Warehouse filtering test failed:', error);
        return { success: false, error: error.message };
    }
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
    window.testInventoryAPI = {
        testInventoryFiltering,
        testWarehouseFiltering
    };
}