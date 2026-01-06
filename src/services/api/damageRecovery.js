/**
 * Damage & Recovery API Service
 * Handles damage reporting and stock recovery operations
 */

const API_BASE = 'https://13-201-222-24.nip.io/api';

/**
 * Report damage
 */
export const reportDamage = async (damageData) => {
    const response = await fetch(`${API_BASE}/damage-recovery/damage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(damageData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to report damage');
    }

    return response.json();
};

/**
 * Recover stock
 */
export const recoverStock = async (recoveryData) => {
    const response = await fetch(`${API_BASE}/damage-recovery/recover`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(recoveryData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to recover stock');
    }

    return response.json();
};

/**
 * Get damage & recovery log with filters
 */
export const getDamageRecoveryLog = async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            params.append(key, filters[key]);
        }
    });

    const response = await fetch(`${API_BASE}/damage-recovery/log?${params}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch damage recovery log');
    }

    return response.json();
};

/**
 * Get damage/recovery summary by warehouse
 */
export const getDamageRecoverySummary = async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            params.append(key, filters[key]);
        }
    });

    const response = await fetch(`${API_BASE}/damage-recovery/summary?${params}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch damage recovery summary');
    }

    return response.json();
};

/**
 * Get product suggestions for damage/recovery
 */
export const getProductSuggestions = async (search, warehouse = null) => {
    const params = new URLSearchParams({ search });
    if (warehouse) params.append('warehouse', warehouse);

    const response = await fetch(`${API_BASE}/damage-recovery/suggestions/products?${params}`, {
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