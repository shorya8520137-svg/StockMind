const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.hunyhuny.org/api';

export class PermissionsAPI {
    // ================= AUTHENTICATION ================= //
    
    static async login(credentials) {
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `Login failed: ${response.status}`);
            }
            
            // Store JWT token
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    static async logout() {
        try {
            const token = localStorage.getItem('authToken');
            
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        } catch (error) {
            console.error('Logout error:', error);
            // Clear local storage anyway
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
    }
    
    static async refreshToken() {
        try {
            const token = localStorage.getItem('authToken');
            
            const response = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error('Token refresh failed');
            }
            
            const data = await response.json();
            
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            
            return data;
        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }
    
    // ================= USER MANAGEMENT ================= //
    
    static async getUsers() {
        return this.makeAuthenticatedRequest('/users');
    }
    
    static async getUserById(userId) {
        return this.makeAuthenticatedRequest(`/users/${userId}`);
    }
    
    static async createUser(userData) {
        return this.makeAuthenticatedRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    
    static async updateUser(userId, userData) {
        return this.makeAuthenticatedRequest(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }
    
    static async deleteUser(userId) {
        return this.makeAuthenticatedRequest(`/users/${userId}`, {
            method: 'DELETE'
        });
    }
    
    static async updateUserRole(userId, roleId) {
        return this.makeAuthenticatedRequest(`/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ roleId })
        });
    }
    
    // ================= ROLE MANAGEMENT ================= //
    
    static async getRoles() {
        return this.makeAuthenticatedRequest('/roles');
    }
    
    static async getRoleById(roleId) {
        return this.makeAuthenticatedRequest(`/roles/${roleId}`);
    }
    
    static async createRole(roleData) {
        return this.makeAuthenticatedRequest('/roles', {
            method: 'POST',
            body: JSON.stringify(roleData)
        });
    }
    
    static async updateRole(roleId, roleData) {
        return this.makeAuthenticatedRequest(`/roles/${roleId}`, {
            method: 'PUT',
            body: JSON.stringify(roleData)
        });
    }
    
    static async deleteRole(roleId) {
        return this.makeAuthenticatedRequest(`/roles/${roleId}`, {
            method: 'DELETE'
        });
    }
    
    // ================= PERMISSION MANAGEMENT ================= //
    
    static async getPermissions() {
        return this.makeAuthenticatedRequest('/permissions');
    }
    
    static async getPermissionById(permissionId) {
        return this.makeAuthenticatedRequest(`/permissions/${permissionId}`);
    }
    
    static async createPermission(permissionData) {
        return this.makeAuthenticatedRequest('/permissions', {
            method: 'POST',
            body: JSON.stringify(permissionData)
        });
    }
    
    static async updatePermission(permissionId, permissionData) {
        return this.makeAuthenticatedRequest(`/permissions/${permissionId}`, {
            method: 'PUT',
            body: JSON.stringify(permissionData)
        });
    }
    
    static async deletePermission(permissionId) {
        return this.makeAuthenticatedRequest(`/permissions/${permissionId}`, {
            method: 'DELETE'
        });
    }
    
    // ================= ROLE-PERMISSION MAPPING ================= //
    
    static async getRolePermissions(roleId) {
        return this.makeAuthenticatedRequest(`/roles/${roleId}/permissions`);
    }
    
    static async assignPermissionToRole(roleId, permissionId) {
        return this.makeAuthenticatedRequest(`/roles/${roleId}/permissions`, {
            method: 'POST',
            body: JSON.stringify({ permissionId })
        });
    }
    
    static async removePermissionFromRole(roleId, permissionId) {
        return this.makeAuthenticatedRequest(`/roles/${roleId}/permissions/${permissionId}`, {
            method: 'DELETE'
        });
    }
    
    static async updateRolePermissions(roleId, permissionIds) {
        return this.makeAuthenticatedRequest(`/roles/${roleId}/permissions`, {
            method: 'PUT',
            body: JSON.stringify({ permissionIds })
        });
    }
    
    // ================= AUDIT LOG ================= //
    
    static async getAuditLogs(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.makeAuthenticatedRequest(`/audit-logs?${queryParams}`);
    }
    
    static async createAuditLog(logData) {
        return this.makeAuthenticatedRequest('/audit-logs', {
            method: 'POST',
            body: JSON.stringify(logData)
        });
    }
    
    static async getAuditLogsByUser(userId, filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.makeAuthenticatedRequest(`/audit-logs/user/${userId}?${queryParams}`);
    }
    
    static async getAuditLogsByAction(action, filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.makeAuthenticatedRequest(`/audit-logs/action/${action}?${queryParams}`);
    }
    
    // ================= SYSTEM STATS ================= //
    
    static async getSystemStats() {
        return this.makeAuthenticatedRequest('/system/stats');
    }
    
    static async getPermissionUsage() {
        return this.makeAuthenticatedRequest('/system/permission-usage');
    }
    
    static async getRoleDistribution() {
        return this.makeAuthenticatedRequest('/system/role-distribution');
    }
    
    // ================= HELPER METHODS ================= //
    
    static async makeAuthenticatedRequest(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, requestOptions);
            
            // Handle token expiration
            if (response.status === 401) {
                try {
                    await this.refreshToken();
                    // Retry the request with new token
                    const newToken = localStorage.getItem('authToken');
                    requestOptions.headers.Authorization = `Bearer ${newToken}`;
                    const retryResponse = await fetch(`${API_BASE}${endpoint}`, requestOptions);
                    
                    if (!retryResponse.ok) {
                        const errorData = await retryResponse.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
                    }
                    
                    return await retryResponse.json();
                } catch (refreshError) {
                    // Refresh failed, redirect to login
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                    throw new Error('Authentication failed');
                }
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            // Handle empty responses
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return { success: true };
            }
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }
    
    static getAuthToken() {
        return localStorage.getItem('authToken');
    }
    
    static isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }
}