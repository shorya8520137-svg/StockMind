/**
 * Dispatch API Service
 * Handles warehouse dispatch operations
 */

const API_BASE = 'https://13-201-222-24.nip.io/api';

/**
 * Create new dispatch
 */
export const createDispatch = async (dispatchData) => {
    const response = await fetch(`${API_BASE}/dispatch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dispatchData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create dispatch');
    }

    return response.json();
};

/**
 * Get dispatches with filters
 */
export const getDispatches = async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            params.append(key, filters[key]);
        }
    });

    const response = await fetch(`${API_BASE}/dispatch?${params}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch dispatches');
    }

    return response.json();
};

/**
 * Update dispatch status
 */
export const updateDispatchStatus = async (dispatchId, statusData) => {
    const response = await fetch(`${API_BASE}/dispatch/${dispatchId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update dispatch status');
    }

    return response.json();
};

/**
 * Get product suggestions for dispatch
 */
export const getProductSuggestions = async (search, warehouse = null) => {
    const params = new URLSearchParams({ search });
    if (warehouse) params.append('warehouse', warehouse);

    const response = await fetch(`${API_BASE}/dispatch/suggestions/products?${params}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch product suggestions');
    }

    return response.json();
};

/**
 * Get warehouse suggestions
 */
export const getWarehouseSuggestions = async () => {
    const response = await fetch(`${API_BASE}/dispatch/suggestions/warehouses`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch warehouse suggestions');
    }

    return response.json();
};