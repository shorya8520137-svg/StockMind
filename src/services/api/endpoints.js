// API Endpoints Configuration
// This file documents all the API endpoints used in the application

export const ENDPOINTS = {
    // Base API URL
    BASE_URL: 'https://13-201-222-24.nip.io/api',
    
    // Bulk Upload Endpoints
    BULK_UPLOAD: {
        // Main bulk upload endpoint (as requested)
        UPLOAD: 'POST /api/bulk-upload',
        FULL_URL: 'https://13-201-222-24.nip.io/api/bulk-upload',
        
        // Supporting endpoints
        WAREHOUSES: 'GET /api/bulk-upload/warehouses',
        HISTORY: 'GET /api/bulk-upload/history'
    },
    
    // Inventory Endpoints
    INVENTORY: {
        // Main inventory endpoint with filtering
        // Example: GET /api/inventory?warehouse=GGM_WH&dateFrom=2025-01-01&dateTo=2025-12-31&search=product&stockFilter=in-stock&sortBy=product_name&sortOrder=asc&page=1&limit=50
        LIST: 'GET /api/inventory',
        
        // Export inventory with filters
        // Example: GET /api/inventory/export?warehouse=GGM_WH&dateFrom=2025-01-01&dateTo=2025-12-31&export=true
        EXPORT: 'GET /api/inventory/export',
        
        // Get inventory statistics
        // Example: GET /api/inventory/stats?warehouse=GGM_WH
        STATS: 'GET /api/inventory/stats',
        
        // Get low stock items
        // Example: GET /api/inventory/low-stock?threshold=10&warehouse=GGM_WH
        LOW_STOCK: 'GET /api/inventory/low-stock',
        
        // Get inventory timeline for specific product (updated to new timeline API)
        // Example: GET /api/timeline/BARCODE123?warehouse=BLR_WH&dateFrom=2025-01-01&limit=50
        TIMELINE: 'GET /api/timeline/:productCode'
    },
    
    // Timeline Endpoints (New dedicated timeline API)
    TIMELINE: {
        // Get product timeline with all inventory movements
        // Example: GET /api/timeline/XYZ789?warehouse=BLR_WH&dateFrom=2025-01-01&limit=50
        PRODUCT: 'GET /api/timeline/:productCode',
        
        // Get timeline summary grouped by product or warehouse
        // Example: GET /api/timeline?warehouse=BLR_WH&groupBy=product&dateFrom=2025-01-01
        SUMMARY: 'GET /api/timeline'
    },
    
    // Product Endpoints
    PRODUCTS: {
        LIST: 'GET /api/products',
        GET: 'GET /api/products/:id',
        CREATE: 'POST /api/products',
        UPDATE: 'PUT /api/products/:id',
        DELETE: 'DELETE /api/products/:id',
        SEARCH: 'GET /api/products/search',
        CATEGORIES: 'GET /api/products/categories',
        BULK_IMPORT: 'POST /api/products/bulk-import'
    },
    
    // Order Endpoints
    ORDERS: {
        LIST: 'GET /api/orders',
        GET: 'GET /api/orders/:id',
        CREATE: 'POST /api/orders',
        UPDATE_STATUS: 'PUT /api/orders/:id/status',
        DISPATCH: 'POST /api/orders/:id/dispatch',
        TRACKING: 'GET /api/orders/:id/tracking',
        BY_WAREHOUSE: 'GET /api/orders/warehouse/:warehouse',
        EXPORT: 'GET /api/orders/export'
    },
    
    // Warehouse Endpoints
    WAREHOUSES: {
        LIST: 'GET /api/warehouses',
        GET: 'GET /api/warehouses/:code',
        SEARCH: 'GET /api/warehouses/search',
        STATS: 'GET /api/warehouses/:code/stats',
        INVENTORY: 'GET /api/warehouses/:code/inventory'
    },
    
    // Authentication Endpoints
    AUTH: {
        LOGIN: 'POST /api/auth/login',
        LOGOUT: 'POST /api/auth/logout',
        REFRESH: 'POST /api/auth/refresh',
        PROFILE: 'GET /api/auth/profile',
        UPDATE_PROFILE: 'PUT /api/auth/profile',
        CHANGE_PASSWORD: 'POST /api/auth/change-password'
    },
    
    // System Endpoints
    SYSTEM: {
        HEALTH: 'GET /api/health'
    }
};

// Helper function to get full URL for any endpoint
export function getFullURL(endpoint) {
    return `${ENDPOINTS.BASE_URL}${endpoint.replace(/^(GET|POST|PUT|DELETE)\s+\/api/, '')}`;
}

// Helper function to log all bulk upload endpoints
export function logBulkUploadEndpoints() {
    console.log('📋 Bulk Upload API Endpoints:');
    console.log('🎯 Main Upload:', ENDPOINTS.BULK_UPLOAD.FULL_URL);
    console.log('🏢 Warehouses:', getFullURL(ENDPOINTS.BULK_UPLOAD.WAREHOUSES));
    console.log('📊 History:', getFullURL(ENDPOINTS.BULK_UPLOAD.HISTORY));
}

// Helper function to log inventory filtering examples
export function logInventoryEndpoints() {
    console.log('📦 Inventory API Endpoints:');
    console.log('🔍 Basic Filter:', `${ENDPOINTS.BASE_URL}/inventory?warehouse=GGM_WH&dateFrom=2025-01-01&dateTo=2025-12-31`);
    console.log('🔍 Advanced Filter:', `${ENDPOINTS.BASE_URL}/inventory?warehouse=GGM_WH&dateFrom=2025-01-01&dateTo=2025-12-31&search=product&stockFilter=in-stock&sortBy=product_name&sortOrder=asc&page=1&limit=50`);
    console.log('📊 Export:', `${ENDPOINTS.BASE_URL}/inventory/export?warehouse=GGM_WH&dateFrom=2025-01-01&dateTo=2025-12-31&export=true`);
    console.log('📈 Stats:', `${ENDPOINTS.BASE_URL}/inventory/stats?warehouse=GGM_WH`);
    console.log('⚠️ Low Stock:', `${ENDPOINTS.BASE_URL}/inventory/low-stock?threshold=10&warehouse=GGM_WH`);
}

// Export for development use
if (typeof window !== 'undefined') {
    window.API_ENDPOINTS = ENDPOINTS;
    window.logBulkUploadEndpoints = logBulkUploadEndpoints;
    window.logInventoryEndpoints = logInventoryEndpoints;
}