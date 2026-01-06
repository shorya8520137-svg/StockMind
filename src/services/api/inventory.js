import { apiRequest } from './index';

export const inventoryAPI = {
    /**
     * Get inventory data with filters matching the API endpoint format
     * @param {Object} filters - Filter parameters
     * @returns {Promise} Inventory data
     */
    async getInventory(filters = {}) {
        const params = new URLSearchParams();
        
        // Add warehouse filter (single warehouse)
        if (filters.warehouse) {
            params.append('warehouse', filters.warehouse);
        }
        
        // Add date range filters
        if (filters.dateFrom) {
            params.append('dateFrom', filters.dateFrom);
        }
        if (filters.dateTo) {
            params.append('dateTo', filters.dateTo);
        }
        
        // Add other filters
        if (filters.search) {
            params.append('search', filters.search);
        }
        if (filters.stockFilter && filters.stockFilter !== 'all') {
            params.append('stockFilter', filters.stockFilter);
        }
        if (filters.sortBy) {
            params.append('sortBy', filters.sortBy);
        }
        if (filters.sortOrder) {
            params.append('sortOrder', filters.sortOrder);
        }
        if (filters.page) {
            params.append('page', filters.page);
        }
        if (filters.limit) {
            params.append('limit', filters.limit);
        }
        
        const endpoint = params.toString() ? `/inventory?${params}` : '/inventory';
        return apiRequest(endpoint);
    },

    /**
     * Get inventory by specific warehouse
     * @param {string} warehouse - Warehouse code
     * @param {Object} filters - Additional filters
     * @returns {Promise} Warehouse inventory data
     */
    async getInventoryByWarehouse(warehouse, filters = {}) {
        return this.getInventory({ warehouse, ...filters });
    },

    /**
     * Export inventory data
     * @param {Object} filters - Filter parameters for export
     * @returns {Promise} Export data
     */
    async exportInventory(filters = {}) {
        const params = new URLSearchParams({ export: 'true', ...filters });
        return apiRequest(`/inventory/export?${params}`);
    },

    /**
     * Get inventory statistics
     * @param {string} warehouse - Optional warehouse filter
     * @returns {Promise} Inventory stats
     */
    async getInventoryStats(warehouse = null) {
        const params = warehouse ? `?warehouse=${warehouse}` : '';
        return apiRequest(`/inventory/stats${params}`);
    },

    /**
     * Search inventory items
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @returns {Promise} Search results
     */
    async searchInventory(query, filters = {}) {
        return this.getInventory({ search: query, ...filters });
    },

    /**
     * Get low stock items
     * @param {number} threshold - Stock threshold
     * @param {string} warehouse - Optional warehouse filter
     * @returns {Promise} Low stock items
     */
    async getLowStockItems(threshold = 10, warehouse = null) {
        const params = new URLSearchParams({ threshold: threshold.toString() });
        if (warehouse) {
            params.append('warehouse', warehouse);
        }
        return apiRequest(`/inventory/low-stock?${params}`);
    },

    /**
     * Get inventory timeline for a specific product
     * @param {string} productCode - Product barcode or code
     * @param {Object} options - Optional filters (warehouse, dateFrom, dateTo, limit)
     * @returns {Promise} Timeline data
     */
    async getInventoryTimeline(productCode, options = {}) {
        const params = new URLSearchParams();
        if (options.warehouse) params.append('warehouse', options.warehouse);
        if (options.dateFrom) params.append('dateFrom', options.dateFrom);
        if (options.dateTo) params.append('dateTo', options.dateTo);
        if (options.limit) params.append('limit', options.limit);
        
        const queryString = params.toString();
        return apiRequest(`/timeline/${productCode}${queryString ? `?${queryString}` : ''}`);
    }
};