import { apiRequest } from './index';

export const ordersAPI = {
    /**
     * Get all orders with optional filters
     * @param {Object} filters - Filter parameters
     * @returns {Promise} Orders data
     */
    async getOrders(filters = {}) {
        const params = new URLSearchParams(filters);
        const endpoint = params.toString() ? `/orders?${params}` : '/orders';
        return apiRequest(endpoint);
    },

    /**
     * Get single order by ID
     * @param {string|number} id - Order ID
     * @returns {Promise} Order data
     */
    async getOrder(id) {
        return apiRequest(`/orders/${id}`);
    },

    /**
     * Create new order
     * @param {Object} orderData - Order information
     * @returns {Promise} Created order
     */
    async createOrder(orderData) {
        return apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },

    /**
     * Update order status
     * @param {string|number} id - Order ID
     * @param {string} status - New status
     * @returns {Promise} Updated order
     */
    async updateOrderStatus(id, status) {
        return apiRequest(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    /**
     * Dispatch order
     * @param {string|number} id - Order ID
     * @param {Object} dispatchData - Dispatch information
     * @returns {Promise} Dispatch result
     */
    async dispatchOrder(id, dispatchData) {
        return apiRequest(`/orders/${id}/dispatch`, {
            method: 'POST',
            body: JSON.stringify(dispatchData)
        });
    },

    /**
     * Get order tracking information
     * @param {string|number} id - Order ID
     * @returns {Promise} Tracking data
     */
    async getOrderTracking(id) {
        return apiRequest(`/orders/${id}/tracking`);
    },

    /**
     * Get orders by warehouse
     * @param {string} warehouse - Warehouse code
     * @returns {Promise} Warehouse orders
     */
    async getOrdersByWarehouse(warehouse) {
        return apiRequest(`/orders/warehouse/${warehouse}`);
    },

    /**
     * Export orders
     * @param {Object} filters - Export filters
     * @param {string} format - Export format
     * @returns {Promise} Export data
     */
    async exportOrders(filters = {}, format = 'csv') {
        const params = new URLSearchParams({ ...filters, format });
        return apiRequest(`/orders/export?${params}`);
    }
};