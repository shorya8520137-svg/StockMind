// Main API exports - centralized access to all API services
export { API_CONFIG, apiRequest, checkAPIHealth } from './api/index';
export { bulkUploadAPI } from './api/bulkUpload';
export { inventoryAPI } from './api/inventory';
export { productsAPI } from './api/products';
export { ordersAPI } from './api/orders';
export { warehousesAPI } from './api/warehouses';
export { authAPI } from './api/auth';

// Re-export permissions API for backward compatibility
export { PermissionsAPI } from './permissionsApi';

// Convenience function to get all APIs
export const API = {
    bulkUpload: () => import('./api/bulkUpload').then(m => m.bulkUploadAPI),
    inventory: () => import('./api/inventory').then(m => m.inventoryAPI),
    products: () => import('./api/products').then(m => m.productsAPI),
    orders: () => import('./api/orders').then(m => m.ordersAPI),
    warehouses: () => import('./api/warehouses').then(m => m.warehousesAPI),
    auth: () => import('./api/auth').then(m => m.authAPI),
    permissions: () => import('./permissionsApi').then(m => m.PermissionsAPI)
};