import { apiRequest } from './index';

export const productsAPI = {
    /**
     * Get all products with optional filters
     * @param {Object} filters - Filter parameters
     * @returns {Promise} Products data
     */
    async getProducts(filters = {}) {
        const params = new URLSearchParams(filters);
        const endpoint = params.toString() ? `/products?${params}` : '/products';
        return apiRequest(endpoint);
    },

    /**
     * Get single product by ID
     * @param {string|number} id - Product ID
     * @returns {Promise} Product data
     */
    async getProduct(id) {
        return apiRequest(`/products/${id}`);
    },

    /**
     * Create new product
     * @param {Object} productData - Product information
     * @returns {Promise} Created product
     */
    async createProduct(productData) {
        return apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    },

    /**
     * Update existing product
     * @param {string|number} id - Product ID
     * @param {Object} productData - Updated product information
     * @returns {Promise} Updated product
     */
    async updateProduct(id, productData) {
        return apiRequest(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    },

    /**
     * Delete product
     * @param {string|number} id - Product ID
     * @returns {Promise} Deletion result
     */
    async deleteProduct(id) {
        return apiRequest(`/products/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Search products
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @returns {Promise} Search results
     */
    async searchProducts(query, filters = {}) {
        const params = new URLSearchParams({ 
            q: query,
            ...filters 
        });
        return apiRequest(`/products/search?${params}`);
    },

    /**
     * Get product categories
     * @returns {Promise} Product categories
     */
    async getCategories() {
        return apiRequest('/products/categories');
    },

    /**
     * Bulk import products
     * @param {Array} products - Array of product data
     * @returns {Promise} Import result
     */
    async bulkImport(products) {
        return apiRequest('/products/bulk-import', {
            method: 'POST',
            body: JSON.stringify({ products })
        });
    },

    /**
     * Bulk import products with real-time progress tracking
     * @param {File} file - File to upload
     * @param {Function} onProgress - Progress callback function
     * @returns {Promise} Import result with progress updates
     */
    async bulkImportWithProgress(file, onProgress) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "https://13-201-222-24.nip.io/api";
        
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);

            fetch(`${API_BASE_URL}/products/bulk/import/progress`, {
                method: 'POST',
                body: formData
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                function readStream() {
                    return reader.read().then(({ done, value }) => {
                        if (done) {
                            return;
                        }

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');

                        lines.forEach(line => {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    
                                    if (onProgress) {
                                        onProgress(data);
                                    }

                                    if (data.type === 'complete') {
                                        resolve({
                                            success: true,
                                            count: data.successful,
                                            successful: data.successful,
                                            errors: data.failed,
                                            errorDetails: data.errorDetails,
                                            message: data.message
                                        });
                                        return;
                                    }

                                    if (data.type === 'error' && !data.row) {
                                        reject(new Error(data.message));
                                        return;
                                    }
                                } catch (e) {
                                    console.warn('Failed to parse SSE data:', line);
                                }
                            }
                        });

                        return readStream();
                    });
                }

                return readStream();
            }).catch(error => {
                reject(error);
            });
        });
    }
};