"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { PermissionsAPI } from "../services/permissionsApi";

const PermissionsContext = createContext(null);

// Define all available permissions
export const PERMISSIONS = {
    // Dashboard permissions
    DASHBOARD_VIEW: 'dashboard.view',
    DASHBOARD_ANALYTICS: 'dashboard.analytics',
    DASHBOARD_EXPORT: 'dashboard.export',
    
    // Inventory permissions
    INVENTORY_VIEW: 'inventory.view',
    INVENTORY_CREATE: 'inventory.create',
    INVENTORY_EDIT: 'inventory.edit',
    INVENTORY_DELETE: 'inventory.delete',
    INVENTORY_TRANSFER: 'inventory.transfer',
    INVENTORY_EXPORT: 'inventory.export',
    INVENTORY_BULK_UPLOAD: 'inventory.bulk_upload',
    
    // Orders permissions
    ORDERS_VIEW: 'orders.view',
    ORDERS_CREATE: 'orders.create',
    ORDERS_EDIT: 'orders.edit',
    ORDERS_DELETE: 'orders.delete',
    ORDERS_DISPATCH: 'orders.dispatch',
    ORDERS_EXPORT: 'orders.export',
    ORDERS_REMARKS: 'orders.remarks',
    
    // Tracking permissions
    TRACKING_VIEW: 'tracking.view',
    TRACKING_REAL_TIME: 'tracking.real_time',
    
    // Products permissions
    PRODUCTS_VIEW: 'products.view',
    PRODUCTS_CREATE: 'products.create',
    PRODUCTS_EDIT: 'products.edit',
    PRODUCTS_DELETE: 'products.delete',
    PRODUCTS_CATEGORIES: 'products.categories',
    PRODUCTS_BULK_IMPORT: 'products.bulk_import',
    PRODUCTS_EXPORT: 'products.export',
    
    // Operations permissions
    OPERATIONS_DISPATCH: 'operations.dispatch',
    OPERATIONS_DAMAGE: 'operations.damage',
    OPERATIONS_RETURN: 'operations.return',
    OPERATIONS_RECOVER: 'operations.recover',
    OPERATIONS_BULK: 'operations.bulk',
    
    // System permissions
    SYSTEM_SETTINGS: 'system.settings',
    SYSTEM_USER_MANAGEMENT: 'system.user_management',
    SYSTEM_PERMISSIONS: 'system.permissions',
    SYSTEM_AUDIT_LOG: 'system.audit_log',
    
    // Export permissions
    EXPORT_CSV: 'export.csv',
    EXPORT_PDF: 'export.pdf',
    EXPORT_EXCEL: 'export.excel',
};

// Define roles and their permissions
export const ROLES = {
    SUPER_ADMIN: {
        name: 'Super Admin',
        description: 'Full system access with user management',
        permissions: Object.values(PERMISSIONS), // All permissions
        color: '#dc2626', // Red
        priority: 1
    },
    ADMIN: {
        name: 'Admin',
        description: 'Full operational access without user management',
        permissions: [
            PERMISSIONS.DASHBOARD_VIEW,
            PERMISSIONS.DASHBOARD_ANALYTICS,
            PERMISSIONS.DASHBOARD_EXPORT,
            PERMISSIONS.INVENTORY_VIEW,
            PERMISSIONS.INVENTORY_CREATE,
            PERMISSIONS.INVENTORY_EDIT,
            PERMISSIONS.INVENTORY_DELETE,
            PERMISSIONS.INVENTORY_TRANSFER,
            PERMISSIONS.INVENTORY_EXPORT,
            PERMISSIONS.INVENTORY_BULK_UPLOAD,
            PERMISSIONS.ORDERS_VIEW,
            PERMISSIONS.ORDERS_CREATE,
            PERMISSIONS.ORDERS_EDIT,
            PERMISSIONS.ORDERS_DELETE,
            PERMISSIONS.ORDERS_DISPATCH,
            PERMISSIONS.ORDERS_EXPORT,
            PERMISSIONS.ORDERS_REMARKS,
            PERMISSIONS.TRACKING_VIEW,
            PERMISSIONS.TRACKING_REAL_TIME,
            PERMISSIONS.PRODUCTS_VIEW,
            PERMISSIONS.PRODUCTS_CREATE,
            PERMISSIONS.PRODUCTS_EDIT,
            PERMISSIONS.PRODUCTS_DELETE,
            PERMISSIONS.PRODUCTS_CATEGORIES,
            PERMISSIONS.PRODUCTS_BULK_IMPORT,
            PERMISSIONS.PRODUCTS_EXPORT,
            PERMISSIONS.OPERATIONS_DISPATCH,
            PERMISSIONS.OPERATIONS_DAMAGE,
            PERMISSIONS.OPERATIONS_RETURN,
            PERMISSIONS.OPERATIONS_RECOVER,
            PERMISSIONS.OPERATIONS_BULK,
            PERMISSIONS.EXPORT_CSV,
            PERMISSIONS.EXPORT_PDF,
            PERMISSIONS.EXPORT_EXCEL,
        ],
        color: '#ea580c', // Orange
        priority: 2
    },
    MANAGER: {
        name: 'Manager',
        description: 'Management access with reporting capabilities',
        permissions: [
            PERMISSIONS.DASHBOARD_VIEW,
            PERMISSIONS.DASHBOARD_ANALYTICS,
            PERMISSIONS.DASHBOARD_EXPORT,
            PERMISSIONS.INVENTORY_VIEW,
            PERMISSIONS.INVENTORY_EDIT,
            PERMISSIONS.INVENTORY_TRANSFER,
            PERMISSIONS.INVENTORY_EXPORT,
            PERMISSIONS.ORDERS_VIEW,
            PERMISSIONS.ORDERS_CREATE,
            PERMISSIONS.ORDERS_EDIT,
            PERMISSIONS.ORDERS_DISPATCH,
            PERMISSIONS.ORDERS_EXPORT,
            PERMISSIONS.ORDERS_REMARKS,
            PERMISSIONS.TRACKING_VIEW,
            PERMISSIONS.TRACKING_REAL_TIME,
            PERMISSIONS.PRODUCTS_VIEW,
            PERMISSIONS.PRODUCTS_CREATE,
            PERMISSIONS.PRODUCTS_EDIT,
            PERMISSIONS.PRODUCTS_CATEGORIES,
            PERMISSIONS.PRODUCTS_EXPORT,
            PERMISSIONS.OPERATIONS_DISPATCH,
            PERMISSIONS.OPERATIONS_DAMAGE,
            PERMISSIONS.OPERATIONS_RETURN,
            PERMISSIONS.EXPORT_CSV,
            PERMISSIONS.EXPORT_EXCEL,
        ],
        color: '#2563eb', // Blue
        priority: 3
    },
    OPERATOR: {
        name: 'Operator',
        description: 'Operational access for daily tasks',
        permissions: [
            PERMISSIONS.DASHBOARD_VIEW,
            PERMISSIONS.INVENTORY_VIEW,
            PERMISSIONS.INVENTORY_EDIT,
            PERMISSIONS.INVENTORY_TRANSFER,
            PERMISSIONS.ORDERS_VIEW,
            PERMISSIONS.ORDERS_CREATE,
            PERMISSIONS.ORDERS_EDIT,
            PERMISSIONS.ORDERS_DISPATCH,
            PERMISSIONS.ORDERS_REMARKS,
            PERMISSIONS.TRACKING_VIEW,
            PERMISSIONS.OPERATIONS_DISPATCH,
            PERMISSIONS.OPERATIONS_DAMAGE,
            PERMISSIONS.OPERATIONS_RETURN,
        ],
        color: '#16a34a', // Green
        priority: 4
    },
    WAREHOUSE_STAFF: {
        name: 'Warehouse Staff',
        description: 'Inventory and warehouse operations only',
        permissions: [
            PERMISSIONS.INVENTORY_VIEW,
            PERMISSIONS.INVENTORY_EDIT,
            PERMISSIONS.INVENTORY_TRANSFER,
            PERMISSIONS.ORDERS_VIEW,
            PERMISSIONS.ORDERS_DISPATCH,
            PERMISSIONS.TRACKING_VIEW,
            PERMISSIONS.OPERATIONS_DISPATCH,
        ],
        color: '#7c3aed', // Purple
        priority: 5
    },
    VIEWER: {
        name: 'Viewer',
        description: 'Read-only access to reports and data',
        permissions: [
            PERMISSIONS.DASHBOARD_VIEW,
            PERMISSIONS.INVENTORY_VIEW,
            PERMISSIONS.ORDERS_VIEW,
            PERMISSIONS.TRACKING_VIEW,
        ],
        color: '#64748b', // Gray
        priority: 6
    }
};

// Feature-based access control
export const FEATURES = {
    DASHBOARD: {
        name: 'Dashboard',
        requiredPermissions: [PERMISSIONS.DASHBOARD_VIEW],
        route: '/dashboard',
        icon: 'LayoutDashboard'
    },
    INVENTORY: {
        name: 'Inventory',
        requiredPermissions: [PERMISSIONS.INVENTORY_VIEW],
        route: '/inventory',
        icon: 'Package'
    },
    ORDERS: {
        name: 'Orders',
        requiredPermissions: [PERMISSIONS.ORDERS_VIEW],
        route: '/order',
        icon: 'Truck'
    },
    TRACKING: {
        name: 'Tracking',
        requiredPermissions: [PERMISSIONS.TRACKING_VIEW],
        route: '/tracking',
        icon: 'MapPin'
    }
};

export function PermissionsProvider({ children }) {
    const { user, apiAvailable } = useAuth();
    const [userPermissions, setUserPermissions] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [roles, setRoles] = useState(ROLES);
    const [permissions, setPermissions] = useState(PERMISSIONS);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && user.role) {
            loadUserPermissions();
        } else {
            setUserRole(null);
            setUserPermissions([]);
        }
    }, [user, apiAvailable]);

    const loadUserPermissions = async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            if (apiAvailable) {
                // Load from API
                try {
                    const [rolesData, permissionsData] = await Promise.all([
                        PermissionsAPI.getRoles(),
                        PermissionsAPI.getPermissions()
                    ]);
                    
                    // Update roles and permissions from API
                    if (rolesData) setRoles(rolesData);
                    if (permissionsData) setPermissions(permissionsData);
                    
                    // Get user's role permissions from API
                    const userRoleData = rolesData?.find(r => r.name === user.role);
                    if (userRoleData) {
                        const rolePermissions = await PermissionsAPI.getRolePermissions(userRoleData.id);
                        setUserRole(userRoleData);
                        setUserPermissions(rolePermissions?.map(p => p.name) || []);
                    }
                } catch (apiError) {
                    console.warn('Failed to load permissions from API, using local data:', apiError);
                    loadLocalPermissions();
                }
            } else {
                loadLocalPermissions();
            }
        } catch (error) {
            console.error('Error loading permissions:', error);
            loadLocalPermissions();
        } finally {
            setLoading(false);
        }
    };

    const loadLocalPermissions = () => {
        // Fallback to local permissions
        const roleKey = user.role.toUpperCase();
        const role = ROLES[roleKey];
        
        if (role) {
            setUserRole(role);
            setUserPermissions(role.permissions);
        } else {
            // Default to VIEWER if role not found
            setUserRole(ROLES.VIEWER);
            setUserPermissions(ROLES.VIEWER.permissions);
        }
    };

    const hasPermission = (permission) => {
        if (!user || !userPermissions.length) return false;
        return userPermissions.includes(permission);
    };

    const hasAnyPermission = (permissions) => {
        if (!user || !userPermissions.length) return false;
        return permissions.some(permission => userPermissions.includes(permission));
    };

    const hasAllPermissions = (permissions) => {
        if (!user || !userPermissions.length) return false;
        return permissions.every(permission => userPermissions.includes(permission));
    };

    const canAccessFeature = (featureKey) => {
        const feature = FEATURES[featureKey];
        if (!feature) return false;
        return hasAnyPermission(feature.requiredPermissions);
    };

    const getAccessibleFeatures = () => {
        return Object.entries(FEATURES).filter(([key, feature]) => 
            canAccessFeature(key)
        ).map(([key, feature]) => ({ key, ...feature }));
    };

    const getRoleColor = () => {
        return userRole?.color || '#64748b';
    };

    const getRolePriority = () => {
        return userRole?.priority || 999;
    };

    const isHigherRole = (otherRole) => {
        const currentPriority = getRolePriority();
        const otherPriority = ROLES[otherRole?.toUpperCase()]?.priority || 999;
        return currentPriority < otherPriority;
    };

    // Audit logging function
    const logAction = async (action, resource, details = {}) => {
        if (!user) return;
        
        const logEntry = {
            action,
            resource,
            details: {
                ...details,
                source: apiAvailable ? 'api' : 'local'
            }
        };
        
        try {
            if (apiAvailable) {
                // Send to API
                await PermissionsAPI.createAuditLog(logEntry);
            } else {
                // Store locally
                const fullLogEntry = {
                    timestamp: new Date().toISOString(),
                    user: user.email,
                    role: user.role,
                    ...logEntry,
                    ip: 'client-side'
                };
                
                const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
                auditLog.push(fullLogEntry);
                
                // Keep only last 1000 entries
                if (auditLog.length > 1000) {
                    auditLog.splice(0, auditLog.length - 1000);
                }
                
                localStorage.setItem('auditLog', JSON.stringify(auditLog));
            }
        } catch (error) {
            console.error('Failed to log action:', error);
        }
    };

    const getAuditLog = async () => {
        if (!hasPermission(PERMISSIONS.SYSTEM_AUDIT_LOG)) return [];
        
        try {
            if (apiAvailable) {
                const logs = await PermissionsAPI.getAuditLogs({ limit: 50 });
                return logs || [];
            } else {
                return JSON.parse(localStorage.getItem('auditLog') || '[]');
            }
        } catch (error) {
            console.error('Failed to get audit log:', error);
            return JSON.parse(localStorage.getItem('auditLog') || '[]');
        }
    };

    return (
        <PermissionsContext.Provider
            value={{
                userPermissions,
                userRole,
                hasPermission,
                hasAnyPermission,
                hasAllPermissions,
                canAccessFeature,
                getAccessibleFeatures,
                getRoleColor,
                getRolePriority,
                isHigherRole,
                logAction,
                getAuditLog,
                loading,
                apiAvailable,
                PERMISSIONS,
                ROLES: roles,
                FEATURES
            }}
        >
            {children}
        </PermissionsContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error("usePermissions must be used within PermissionsProvider");
    }
    return context;
}

// Convenience hooks
export function useHasPermission(permission) {
    const { hasPermission } = usePermissions();
    return hasPermission(permission);
}

export function useCanAccess(featureKey) {
    const { canAccessFeature } = usePermissions();
    return canAccessFeature(featureKey);
}

export function useRole() {
    const { userRole } = usePermissions();
    return userRole;
}