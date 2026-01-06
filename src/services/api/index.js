// Central API configuration
export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_BASE || 'https://13-201-222-24.nip.io/api',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json',
    }
};

// Base API function with error handling
export async function apiRequest(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        const config = {
            headers: API_CONFIG.HEADERS,
            signal: controller.signal,
            ...options,
        };

        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

// Health check
export async function checkAPIHealth() {
    try {
        const response = await apiRequest('/health');
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Export all API services
export * as auth from './auth.js';
export * as inventory from './inventory.js';
export * as products from './products.js';
export * as orders from './orders.js';
export * as warehouses from './warehouses.js';
export * as bulkUpload from './bulkUpload.js';
export * as dispatch from './dispatch.js';
export * as returns from './returns.js';
export * as damageRecovery from './damageRecovery.js';