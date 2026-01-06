/**
 * Returns API Service
 * Handles return operations
 */

const API_BASE = 'https://13-201-222-24.nip.io/api';

/**
 * Create new return
 */
export const createReturn = async (returnData) => {
    const response = await fetch(`${API_BASE}/returns`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(returnData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create return');
    }

    return response.json();
};

/**
 * Get returns with filters
 */
export const getReturns = async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            params.append(key, filters[key]);
        }
    });

    const response = await fetch(`${API_BASE}/returns?${params}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch returns');
    }

    return response.json();
};

/**
 * Get return by ID
 */
export const getReturnById = async (returnId) => {
    const response = await fetch(`${API_BASE}/returns/${returnId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch return');
    }

    return response.json();
};

/**
 * Process bulk returns
 */
export const processBulkReturns = async (returnsData) => {
    const response = await fetch(`${API_BASE}/returns/bulk`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ returns: returnsData })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process bulk returns');
    }

    return response.json();
};

/**
 * Get product suggestions for returns
 */
export const getProductSuggestions = async (search) => {
    const params = new URLSearchParams({ search });

    const response = await fetch(`${API_BASE}/returns/suggestions/products?${params}`, {
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