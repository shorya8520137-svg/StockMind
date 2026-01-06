"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, PERMISSIONS, ROLES } from '@/contexts/PermissionsContext';
import { Shield, Users, Settings, Plus, Edit, Trash2, Search, Filter, Download, RefreshCw, Eye, EyeOff, User, Key, Activity, TestTube } from 'lucide-react';
import styles from './permissions.module.css';

// Dashboard components mapping for permissions
const DASHBOARD_COMPONENTS = {
    'dashboard': {
        name: 'Dashboard',
        description: 'Main dashboard with analytics and KPIs',
        permissions: [
            PERMISSIONS.DASHBOARD_VIEW,
            PERMISSIONS.DASHBOARD_ANALYTICS,
            PERMISSIONS.DASHBOARD_EXPORT
        ]
    },
    'inventory': {
        name: 'Inventory Management',
        description: 'Stock management and transfers',
        permissions: [
            PERMISSIONS.INVENTORY_VIEW,
            PERMISSIONS.INVENTORY_CREATE,
            PERMISSIONS.INVENTORY_EDIT,
            PERMISSIONS.INVENTORY_DELETE,
            PERMISSIONS.INVENTORY_TRANSFER,
            PERMISSIONS.INVENTORY_EXPORT,
            PERMISSIONS.INVENTORY_BULK_UPLOAD
        ]
    },
    'orders': {
        name: 'Order Management',
        description: 'Order processing and dispatch',
        permissions: [
            PERMISSIONS.ORDERS_VIEW,
            PERMISSIONS.ORDERS_CREATE,
            PERMISSIONS.ORDERS_EDIT,
            PERMISSIONS.ORDERS_DELETE,
            PERMISSIONS.ORDERS_DISPATCH,
            PERMISSIONS.ORDERS_EXPORT,
            PERMISSIONS.ORDERS_REMARKS
        ]
    },
    'products': {
        name: 'Product Management',
        description: 'Product catalog and categories',
        permissions: [
            PERMISSIONS.PRODUCTS_VIEW,
            PERMISSIONS.PRODUCTS_CREATE,
            PERMISSIONS.PRODUCTS_EDIT,
            PERMISSIONS.PRODUCTS_DELETE,
            PERMISSIONS.PRODUCTS_CATEGORIES,
            PERMISSIONS.PRODUCTS_BULK_IMPORT,
            PERMISSIONS.PRODUCTS_EXPORT
        ]
    },
    'tracking': {
        name: 'Tracking System',
        description: 'Real-time order tracking',
        permissions: [
            PERMISSIONS.TRACKING_VIEW,
            PERMISSIONS.TRACKING_REAL_TIME
        ]
    },
    'messages': {
        name: 'Team Messages',
        description: 'Internal communication system',
        permissions: [
            PERMISSIONS.MESSAGES_VIEW,
            PERMISSIONS.MESSAGES_SEND,
            PERMISSIONS.MESSAGES_CREATE_CHANNEL,
            PERMISSIONS.MESSAGES_DELETE,
            PERMISSIONS.MESSAGES_VOICE,
            PERMISSIONS.MESSAGES_FILE_UPLOAD
        ]
    },
    'operations': {
        name: 'Operations',
        description: 'Dispatch, damage, return operations',
        permissions: [
            PERMISSIONS.OPERATIONS_DISPATCH,
            PERMISSIONS.OPERATIONS_DAMAGE,
            PERMISSIONS.OPERATIONS_RETURN,
            PERMISSIONS.OPERATIONS_RECOVER,
            PERMISSIONS.OPERATIONS_BULK
        ]
    },
    'system': {
        name: 'System Administration',
        description: 'User management and system settings',
        permissions: [
            PERMISSIONS.SYSTEM_SETTINGS,
            PERMISSIONS.SYSTEM_USER_MANAGEMENT,
            PERMISSIONS.SYSTEM_PERMISSIONS,
            PERMISSIONS.SYSTEM_AUDIT_LOG
        ]
    }
};

export default function PermissionsManager() {
    const { user, availableUsers, switchRole, apiAvailable } = useAuth();
    const { userPermissions, userRole, hasPermission, getAuditLog, logAction } = usePermissions();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [showAddUser, setShowAddUser] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);

    // Mock users data with permissions (enhanced from availableUsers)
    const [users, setUsers] = useState([
        {
            id: 1,
            name: 'John Admin',
            email: 'admin@example.com',
            role: 'SUPER_ADMIN',
            status: 'active',
            lastLogin: '2024-01-03T10:30:00Z',
            permissions: ROLES.SUPER_ADMIN.permissions,
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 2,
            name: 'Sarah Manager',
            email: 'manager@example.com',
            role: 'MANAGER',
            status: 'active',
            lastLogin: '2024-01-03T09:15:00Z',
            permissions: ROLES.MANAGER.permissions,
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 3,
            name: 'Mike Operator',
            email: 'operator@example.com',
            role: 'OPERATOR',
            status: 'active',
            lastLogin: '2024-01-02T16:45:00Z',
            permissions: ROLES.OPERATOR.permissions,
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 4,
            name: 'Lisa Warehouse',
            email: 'warehouse@example.com',
            role: 'WAREHOUSE_STAFF',
            status: 'inactive',
            lastLogin: '2024-01-01T14:20:00Z',
            permissions: ROLES.WAREHOUSE_STAFF.permissions,
            createdAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 5,
            name: 'Tom Viewer',
            email: 'viewer@example.com',
            role: 'VIEWER',
            status: 'active',
            lastLogin: '2024-01-03T08:00:00Z',
            permissions: ROLES.VIEWER.permissions,
            createdAt: '2024-01-01T00:00:00Z'
        }
    ]);

    // Form state for add/edit user
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        role: 'VIEWER',
        status: 'active',
        permissions: []
    });

    // Check if user has permission to access this page
    if (!hasPermission(PERMISSIONS.SYSTEM_PERMISSIONS)) {
        return (
            <div className={styles.accessDenied}>
                <div className={styles.accessDeniedContent}>
                    <Shield size={48} />
                    <h2>Access Denied</h2>
                    <p>You don't have permission to access the permissions management panel.</p>
                    <p>Required permission: <code>system.permissions</code></p>
                    <p>Your role: <span style={{ color: userRole?.color }}>{userRole?.name}</span></p>
                </div>
            </div>
        );
    }

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !selectedRole || user.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    const handleAddUser = () => {
        setEditingUser(null);
        setUserForm({
            name: '',
            email: '',
            role: 'VIEWER',
            status: 'active',
            permissions: ROLES.VIEWER.permissions
        });
        setShowAddUser(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setUserForm({
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            permissions: user.permissions
        });
        setShowAddUser(true);
    };

    const handleDeleteUser = (userId) => {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            showNotification('User deleted successfully');
        }
    };

    const handleSaveUser = () => {
        if (!userForm.name.trim() || !userForm.email.trim()) {
            showNotification('Name and email are required', 'error');
            return;
        }

        if (editingUser) {
            // Update existing user
            setUsers(prev => prev.map(u => 
                u.id === editingUser.id 
                    ? { ...u, ...userForm, permissions: ROLES[userForm.role].permissions }
                    : u
            ));
            showNotification('User updated successfully');
        } else {
            // Add new user
            const newUser = {
                id: Date.now(),
                ...userForm,
                permissions: ROLES[userForm.role].permissions,
                createdAt: new Date().toISOString(),
                lastLogin: null
            };
            setUsers(prev => [...prev, newUser]);
            showNotification('User created successfully');
        }

        setShowAddUser(false);
        setEditingUser(null);
    };

    const handleRoleChange = (role) => {
        setUserForm(prev => ({
            ...prev,
            role,
            permissions: ROLES[role].permissions
        }));
    };

    const toggleUserPermission = (permission) => {
        setUserForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

    const getComponentPermissions = (componentKey, userPermissions) => {
        const component = DASHBOARD_COMPONENTS[componentKey];
        return component.permissions.filter(permission => userPermissions.includes(permission));
    };

    const hasComponentAccess = (componentKey, userPermissions) => {
        const component = DASHBOARD_COMPONENTS[componentKey];
        return component.permissions.some(permission => userPermissions.includes(permission));
    };

    const loadAuditLogs = async () => {
        if (!hasPermission(PERMISSIONS.SYSTEM_AUDIT_LOG)) return;
        
        setLoading(true);
        try {
            const logs = await getAuditLog();
            setAuditLogs(logs);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleTest = async (roleKey) => {
        if (switchRole(roleKey.toLowerCase())) {
            await logAction('ROLE_SWITCH', 'PERMISSIONS', { 
                oldRole: user.role, 
                newRole: roleKey.toLowerCase(),
                reason: 'Testing permissions'
            });
            // Refresh page to update permissions
            window.location.reload();
        }
    };

    useEffect(() => {
        if (activeTab === 'audit') {
            loadAuditLogs();
        }
    }, [activeTab]);

    const getPermissionsByCategory = () => {
        const categories = {};
        Object.entries(PERMISSIONS).forEach(([key, permission]) => {
            const category = permission.split('.')[0];
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({ key, permission });
        });
        return categories;
    };

    const getRoleUsers = (roleKey) => {
        return users.filter(u => u.role === roleKey).length;
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Eye },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'roles', label: 'Roles & Permissions', icon: Shield },
        { id: 'components', label: 'Component Access', icon: Settings },
        ...(hasPermission(PERMISSIONS.SYSTEM_AUDIT_LOG) ? [{ id: 'audit', label: 'Audit Log', icon: Activity }] : []),
        ...(user?.role === 'super_admin' ? [{ id: 'testing', label: 'Role Testing', icon: TestTube }] : [])
    ];

    return (
        <div className={styles.permissionsContainer}>
            {/* Notification */}
            {notification && (
                <div className={`${styles.notification} ${styles[notification.type]}`}>
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)}>×</button>
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <Shield size={24} />
                    </div>
                    <div className={styles.headerInfo}>
                        <h1>Access Control Center</h1>
                        <span>Enterprise role and permission management</span>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.connectionStatus}>
                        <div className={`${styles.statusIndicator} ${apiAvailable ? styles.online : styles.offline}`}>
                            <div className={styles.statusDot}></div>
                            <span className={styles.statusText}>
                                {apiAvailable ? 'API Connected' : 'Local Mode'}
                            </span>
                        </div>
                    </div>
                    <div className={styles.currentUser}>
                        <div className={styles.userBadge}>
                            <div 
                                className={styles.userRole}
                                style={{ backgroundColor: userRole?.color }}
                            >
                                {userRole?.name?.charAt(0)}
                            </div>
                            <div className={styles.userInfo}>
                                <div className={styles.userName}>{user?.name || user?.email}</div>
                                <div className={styles.userEmail}>{userRole?.name}</div>
                            </div>
                        </div>
                    </div>
                    {hasPermission(PERMISSIONS.SYSTEM_USER_MANAGEMENT) && (
                        <button
                            className={styles.addBtn}
                            onClick={handleAddUser}
                        >
                            <Plus size={14} />
                            Add User
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className={styles.tabNav}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon className={styles.tabIcon} size={16} />
                        <span className={styles.tabLabel}>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className={styles.content}>
                {activeTab === 'overview' && (
                    <div className={styles.overview}>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <h3>System Roles</h3>
                                <div className={styles.statNumber}>{Object.keys(ROLES).length}</div>
                                <p className={styles.statDescription}>Defined access levels</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Permissions</h3>
                                <div className={styles.statNumber}>{Object.keys(PERMISSIONS).length}</div>
                                <p className={styles.statDescription}>Granular controls</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Active Users</h3>
                                <div className={styles.statNumber}>{users.filter(u => u.status === 'active').length}</div>
                                <p className={styles.statDescription}>Registered accounts</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Your Access</h3>
                                <div className={styles.statNumber}>{userPermissions.length}</div>
                                <p className={styles.statDescription}>Granted permissions</p>
                            </div>
                        </div>

                        <div className={styles.rolesOverview}>
                            <h3>Roles Overview</h3>
                            <div className={styles.rolesList}>
                                {Object.entries(ROLES).map(([key, role]) => (
                                    <div 
                                        key={key} 
                                        className={styles.roleCard}
                                        style={{ '--role-color': role.color }}
                                    >
                                        <div className={styles.roleHeader}>
                                            <div 
                                                className={styles.roleColor}
                                                style={{ backgroundColor: role.color }}
                                            ></div>
                                            <div className={styles.roleInfo}>
                                                <h4>{role.name}</h4>
                                                <p>{role.description}</p>
                                            </div>
                                        </div>
                                        <div className={styles.roleStats}>
                                            <span>{role.permissions.length} permissions</span>
                                            <span>{getRoleUsers(key)} users</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && hasPermission(PERMISSIONS.SYSTEM_USER_MANAGEMENT) && (
                    <div className={styles.usersSection}>
                        {/* Filters */}
                        <div className={styles.filters}>
                            <div className={styles.searchGroup}>
                                <Search className={styles.searchIcon} size={16} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={styles.searchInput}
                                />
                            </div>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className={styles.roleFilter}
                            >
                                <option value="">All Roles</option>
                                {Object.entries(ROLES).map(([key, role]) => (
                                    <option key={key} value={key}>{role.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Users Table */}
                        <div className={styles.tableCard}>
                            <div className={styles.tableHeader}>
                                <h3>Users ({filteredUsers.length})</h3>
                                <button className={styles.exportBtn}>
                                    <Download size={14} />
                                    Export
                                </button>
                            </div>
                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Last Login</th>
                                            <th>Permissions</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className={styles.userInfo}>
                                                        <div className={styles.userAvatar}>
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className={styles.userName}>{user.name}</div>
                                                            <div className={styles.userEmail}>{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span 
                                                        className={styles.roleBadge}
                                                        style={{ backgroundColor: ROLES[user.role].color }}
                                                    >
                                                        {ROLES[user.role].name}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.lastLogin}>
                                                        {user.lastLogin 
                                                            ? new Date(user.lastLogin).toLocaleDateString()
                                                            : 'Never'
                                                        }
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.permissionCount}>
                                                        {user.permissions.length} permissions
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.actions}>
                                                        <button
                                                            className={styles.editBtn}
                                                            onClick={() => handleEditUser(user)}
                                                            title="Edit User"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            className={styles.deleteBtn}
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'roles' && (
                    <div className={styles.rolesTab}>
                        <div className={styles.rolesGrid}>
                            {Object.entries(ROLES).map(([key, role]) => (
                                <div 
                                    key={key}
                                    className={`${styles.roleDetailCard} ${selectedRole === key ? styles.selected : ''}`}
                                    onClick={() => setSelectedRole(selectedRole === key ? null : key)}
                                >
                                    <div className={styles.roleDetailHeader}>
                                        <div 
                                            className={styles.roleColorLarge}
                                            style={{ backgroundColor: role.color }}
                                        ></div>
                                        <div>
                                            <h3>{role.name}</h3>
                                            <p>{role.description}</p>
                                            <span className={styles.priority}>Priority: {role.priority}</span>
                                        </div>
                                    </div>
                                    <div className={styles.rolePermissions}>
                                        <h4>Permissions ({role.permissions.length})</h4>
                                        <div className={styles.permissionsList}>
                                            {role.permissions.slice(0, 10).map(permission => (
                                                <span key={permission} className={styles.permissionTag}>
                                                    {permission}
                                                </span>
                                            ))}
                                            {role.permissions.length > 10 && (
                                                <span className={styles.permissionTag}>
                                                    +{role.permissions.length - 10} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.permissionsTab}>
                            <h3>All Permissions by Category</h3>
                            {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
                                <div key={category} className={styles.permissionCategory}>
                                    <h4>{category.charAt(0).toUpperCase() + category.slice(1)} Permissions</h4>
                                    <div className={styles.permissionsGrid}>
                                        {permissions.map(({ key, permission }) => (
                                            <div key={key} className={styles.permissionCard}>
                                                <div className={styles.permissionName}>{permission}</div>
                                                <div className={styles.permissionRoles}>
                                                    {Object.entries(ROLES)
                                                        .filter(([, role]) => role.permissions.includes(permission))
                                                        .map(([roleKey, role]) => (
                                                            <span 
                                                                key={roleKey}
                                                                className={styles.roleTag}
                                                                style={{ backgroundColor: role.color }}
                                                            >
                                                                {role.name}
                                                            </span>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'components' && (
                    <div className={styles.componentsGrid}>
                        {Object.entries(DASHBOARD_COMPONENTS).map(([key, component]) => (
                            <div key={key} className={styles.componentCard}>
                                <div className={styles.componentHeader}>
                                    <h3>{component.name}</h3>
                                    <p>{component.description}</p>
                                </div>
                                <div className={styles.componentUsers}>
                                    <h4>User Access ({users.filter(u => hasComponentAccess(key, u.permissions)).length})</h4>
                                    <div className={styles.usersList}>
                                        {users.map(user => {
                                            const userPermissions = getComponentPermissions(key, user.permissions);
                                            const hasAccess = hasComponentAccess(key, user.permissions);
                                            
                                            return (
                                                <div key={user.id} className={`${styles.userPermissionRow} ${!hasAccess ? styles.noAccess : ''}`}>
                                                    <div className={styles.userDetails}>
                                                        <div className={styles.userAvatar}>
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className={styles.userName}>{user.name}</div>
                                                            <span 
                                                                className={styles.userRole}
                                                                style={{ color: ROLES[user.role].color }}
                                                            >
                                                                {ROLES[user.role].name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={styles.permissionStatus}>
                                                        {hasAccess ? (
                                                            <div className={styles.permissionDetails}>
                                                                <Eye size={14} className={styles.accessIcon} />
                                                                <span>{userPermissions.length}/{component.permissions.length} permissions</span>
                                                            </div>
                                                        ) : (
                                                            <div className={styles.noAccessDetails}>
                                                                <EyeOff size={14} className={styles.noAccessIcon} />
                                                                <span>No access</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'audit' && hasPermission(PERMISSIONS.SYSTEM_AUDIT_LOG) && (
                    <div className={styles.auditTab}>
                        <div className={styles.auditHeader}>
                            <h3>Audit Log</h3>
                            <button 
                                className={styles.refreshBtn}
                                onClick={loadAuditLogs}
                                disabled={loading}
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                        </div>
                        <div className={styles.auditLog}>
                            {loading ? (
                                <div className={styles.loadingState}>
                                    <div className={styles.spinner}></div>
                                    <p>Loading audit logs...</p>
                                </div>
                            ) : auditLogs.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>No audit logs available</p>
                                    <p className={styles.localNote}>
                                        {apiAvailable ? 'No logs found in database' : 'Using local storage logs'}
                                    </p>
                                </div>
                            ) : (
                                auditLogs.slice(0, 50).map((log, index) => (
                                    <div key={index} className={styles.auditEntry}>
                                        <div className={styles.auditTime}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                        <div className={styles.auditUser}>
                                            {log.user || 'System'}
                                        </div>
                                        <div className={styles.auditAction}>
                                            {log.action} on {log.resource}
                                        </div>
                                        <div className={styles.auditDetails}>
                                            {JSON.stringify(log.details)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'testing' && user?.role === 'super_admin' && (
                    <div className={styles.testingTab}>
                        <div className={styles.testingHeader}>
                            <h3>Role Testing</h3>
                            <p>Switch between roles to test different permission levels</p>
                        </div>
                        <div className={styles.roleTestGrid}>
                            {Object.entries(ROLES).map(([key, role]) => (
                                <button
                                    key={key}
                                    className={`${styles.roleTestCard} ${user.role === key.toLowerCase() ? styles.currentRole : ''}`}
                                    onClick={() => handleRoleTest(key)}
                                >
                                    <div 
                                        className={styles.roleTestColor}
                                        style={{ backgroundColor: role.color }}
                                    ></div>
                                    <div className={styles.roleTestInfo}>
                                        <h4>{role.name}</h4>
                                        <p>{role.permissions.length} permissions</p>
                                    </div>
                                    {user.role === key.toLowerCase() && (
                                        <div className={styles.currentBadge}>Current</div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className={styles.testingWarning}>
                            ⚠️ Role switching will refresh the page to apply new permissions
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit User Modal */}
            {showAddUser && hasPermission(PERMISSIONS.SYSTEM_USER_MANAGEMENT) && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowAddUser(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Name *</label>
                                    <input
                                        type="text"
                                        value={userForm.name}
                                        onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="Enter email address"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Role</label>
                                    <select
                                        value={userForm.role}
                                        onChange={(e) => handleRoleChange(e.target.value)}
                                    >
                                        {Object.entries(ROLES).map(([key, role]) => (
                                            <option key={key} value={key}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Status</label>
                                    <select
                                        value={userForm.status}
                                        onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.permissionsSection}>
                                <h3>Component Permissions</h3>
                                <div className={styles.componentPermissions}>
                                    {Object.entries(DASHBOARD_COMPONENTS).map(([key, component]) => (
                                        <div key={key} className={styles.componentPermissionGroup}>
                                            <h4>{component.name}</h4>
                                            <div className={styles.permissionsList}>
                                                {component.permissions.map(permission => (
                                                    <label key={permission} className={styles.permissionCheckbox}>
                                                        <input
                                                            type="checkbox"
                                                            checked={userForm.permissions.includes(permission)}
                                                            onChange={() => toggleUserPermission(permission)}
                                                        />
                                                        <span>{permission.split('.')[1]}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button
                                className={styles.saveBtn}
                                onClick={handleSaveUser}
                            >
                                {editingUser ? 'Update User' : 'Create User'}
                            </button>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowAddUser(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}