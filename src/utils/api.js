// Legacy API utilities - DEPRECATED
// Use the new API services in src/services/api/ instead

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "https://13-201-222-24.nip.io/api";
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000;

// Legacy function - use apiRequest from src/services/api/index.js instead
export async function api(path, method = "GET", body, options = {}) {
    console.warn('DEPRECATED: Use apiRequest from @/services/api instead');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
            ...options,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `API error ${res.status}`);
        }

        return res.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

// Legacy function - use checkAPIHealth from src/services/api instead
export async function testConnection() {
    console.warn('DEPRECATED: Use checkAPIHealth from @/services/api instead');
    
    try {
        const response = await fetch(`${BASE_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            return { success: true, data };
        } else {
            return { success: false, error: `HTTP ${response.status}` };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Legacy bulk upload functions - use bulkUploadAPI from src/services/api instead
export const bulkUploadAPI = {
    async uploadInventory(rows) {
        console.warn('DEPRECATED: Use bulkUploadAPI.upload from @/services/api instead');
        return api('/bulk-upload', 'POST', { rows });
    },

    async getWarehouses() {
        console.warn('DEPRECATED: Use bulkUploadAPI.getWarehouses from @/services/api instead');
        return api('/bulk-upload/warehouses');
    },

    async getUploadHistory() {
        console.warn('DEPRECATED: Use bulkUploadAPI.getHistory from @/services/api instead');
        return api('/bulk-upload/history');
    }
};

// Legacy inventory functions - use inventoryAPI from src/services/api instead
export const inventoryAPI = {
    async getInventory(filters = {}) {
        console.warn('DEPRECATED: Use inventoryAPI.getInventory from @/services/api instead');
        const params = new URLSearchParams(filters);
        return api(`/inventory?${params}`);
    },

    async getInventoryByWarehouse(warehouse) {
        console.warn('DEPRECATED: Use inventoryAPI.getInventoryByWarehouse from @/services/api instead');
        return api(`/inventory/by-warehouse/${warehouse}`);
    },

    async exportInventory(format = 'csv') {
        console.warn('DEPRECATED: Use inventoryAPI.exportInventory from @/services/api instead');
        return api(`/inventory/export?format=${format}`);
    }
};