import { apiRequest } from './index';

export const authAPI = {
    /**
     * User login
     * @param {Object} credentials - Login credentials
     * @returns {Promise} Login result with token
     */
    async login(credentials) {
        try {
            const response = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            
            // Store token and user data in localStorage
            if (response.token) {
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
            }
            
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * User logout
     * @returns {Promise} Logout result
     */
    async logout() {
        try {
            const token = localStorage.getItem('authToken');
            
            if (token) {
                await apiRequest('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage regardless of API call success
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
    },

    /**
     * Refresh authentication token
     * @returns {Promise} New token
     */
    async refreshToken() {
        try {
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                throw new Error('No token available');
            }
            
            const response = await apiRequest('/auth/refresh', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.token) {
                localStorage.setItem('authToken', response.token);
            }
            
            return response;
        } catch (error) {
            console.error('Token refresh error:', error);
            // Clear invalid token
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            throw error;
        }
    },

    /**
     * Get current user profile
     * @returns {Promise} User profile data
     */
    async getProfile() {
        return apiRequest('/auth/profile');
    },

    /**
     * Update user profile
     * @param {Object} profileData - Updated profile data
     * @returns {Promise} Updated profile
     */
    async updateProfile(profileData) {
        return apiRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    },

    /**
     * Change password
     * @param {Object} passwordData - Old and new password
     * @returns {Promise} Change result
     */
    async changePassword(passwordData) {
        return apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
    },

    // New methods for permissions system
    /**
     * Get all users (admin only)
     * @returns {Promise} List of users
     */
    async getUsers() {
        return this.makeAuthenticatedRequest('/users');
    },

    /**
     * Get all roles
     * @returns {Promise} List of roles
     */
    async getRoles() {
        return this.makeAuthenticatedRequest('/roles');
    },

    /**
     * Get all permissions
     * @returns {Promise} List of permissions
     */
    async getPermissions() {
        return this.makeAuthenticatedRequest('/permissions');
    },

    /**
     * Get system statistics
     * @returns {Promise} System stats
     */
    async getSystemStats() {
        return this.makeAuthenticatedRequest('/system/stats');
    },

    /**
     * Create new user
     * @param {Object} userData - User data
     * @returns {Promise} Created user
     */
    async createUser(userData) {
        return this.makeAuthenticatedRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    /**
     * Update user
     * @param {number} userId - User ID
     * @param {Object} userData - Updated user data
     * @returns {Promise} Updated user
     */
    async updateUser(userId, userData) {
        return this.makeAuthenticatedRequest(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    /**
     * Delete user
     * @param {number} userId - User ID
     * @returns {Promise} Delete result
     */
    async deleteUser(userId) {
        return this.makeAuthenticatedRequest(`/users/${userId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Get audit logs
     * @param {Object} filters - Filter parameters
     * @returns {Promise} Audit logs
     */
    async getAuditLogs(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.makeAuthenticatedRequest(`/audit-logs?${queryParams}`);
    },

    // Helper methods
    /**
     * Make authenticated API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise} API response
     */
    async makeAuthenticatedRequest(endpoint, options = {}) {
        const token = this.getToken();
        
        const requestOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        };
        
        try {
            return await apiRequest(endpoint, requestOptions);
        } catch (error) {
            // Handle token expiration
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                try {
                    await this.refreshToken();
                    // Retry with new token
                    const newToken = this.getToken();
                    requestOptions.headers.Authorization = `Bearer ${newToken}`;
                    return await apiRequest(endpoint, requestOptions);
                } catch (refreshError) {
                    // Refresh failed, redirect to login
                    this.clearAuth();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                    throw new Error('Authentication failed');
                }
            }
            throw error;
        }
    },

    /**
     * Get current user from localStorage
     * @returns {Object|null} Current user
     */
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    /**
     * Get auth token from localStorage
     * @returns {string|null} Auth token
     */
    getToken() {
        return localStorage.getItem('authToken');
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    },

    /**
     * Clear authentication data
     */
    clearAuth() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    },

    /**
     * Check if user has specific permission
     * @param {string} permission - Permission to check
     * @returns {boolean} Has permission
     */
    hasPermission(permission) {
        const user = this.getCurrentUser();
        return user?.permissions?.includes(permission) || user?.role === 'super_admin';
    },

    /**
     * Check if user has any of the specified permissions
     * @param {Array} permissions - Permissions to check
     * @returns {boolean} Has any permission
     */
    hasAnyPermission(permissions) {
        return permissions.some(permission => this.hasPermission(permission));
    },

    /**
     * Check if user has specific role
     * @param {string} role - Role to check
     * @returns {boolean} Has role
     */
    hasRole(role) {
        const user = this.getCurrentUser();
        return user?.role === role;
    }
};