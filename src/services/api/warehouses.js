import { apiRequest } from './index';

export const warehousesAPI = {
    /**
     * Get all warehouses
     * @returns {Promise} Warehouses data
     */
    async getWarehouses() {
        return apiRequest('/warehouses');
    },

    /**
     * Get single warehouse by code
     * @param {string} code - Warehouse code
     * @returns {Promise} Warehouse data
     */
    async getWarehouse(code) {
        return apiRequest(`/warehouses/${code}`);
    },

    /**
     * Search warehouses
     * @param {string} query - Search query
     * @returns {Promise} Search results
     */
    async searchWarehouses(query) {
        return apiRequest(`/warehouses/search?q=${query}`);
    },

    /**
     * Get warehouse statistics
     * @param {string} code - Warehouse code
     * @returns {Promise} Warehouse stats
     */
    async getWarehouseStats(code) {
        return apiRequest(`/warehouses/${code}/stats`);
    },

    /**
     * Get warehouse inventory
     * @param {string} code - Warehouse code
     * @returns {Promise} Warehouse inventory
     */
    async getWarehouseInventory(code) {
        return apiRequest(`/warehouses/${code}/inventory`);
    }
};