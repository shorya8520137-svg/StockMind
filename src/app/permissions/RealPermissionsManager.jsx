"use client";

import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Shield, 
    Settings, 
    Eye, 
    EyeOff, 
    Plus, 
    Edit, 
    Trash2, 
    Search, 
    Filter, 
    RefreshCw,
    User,
    Key,
    BarChart3,
    Activity,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import styles from './permissions.module.css';
import { authAPI } from '../../services/api/auth';

export default function RealPermissionsManager() {
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // Real data from API
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [systemStats, setSystemStats] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    
    // UI state
    const [showAddUser, setShowAddUser] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    
    // Form state
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        role_id: '',
        password: ''
    });

    // Load data on component mount
    useEffect(() => {
        // Check authentication status
        const currentUser = authAPI.getCurrentUser();
        if (!currentUser) {
            showMessage('Please login to access the Access Controller', 'error');
            return;
        }
        
        loadInitialData();
    }, []);

    const showMessage = (message, type = 'success') => {
        if (type === 'success') {
            setSuccess(message);
            setError(null);
        } else {
            setError(message);
            setSuccess(null);
        }
        
        setTimeout(() => {
            setSuccess(null);
            setError(null);
        }, 5000);
    };

    const loadInitialData = async () => {
        // Check if user is authenticated first
        if (!authAPI.isAuthenticated()) {
            showMessage('Please login first to access permissions', 'error');
            return;
        }

        setLoading(true);
        try {
            await Promise.all([
                loadUsers(),
                loadRoles(),
                loadPermissions(),
                loadSystemStats()
            ]);
        } catch (error) {
            if (error.message.includes('401') || error.message.includes('Authentication failed')) {
                showMessage('Session expired. Please login again.', 'error');
                // Redirect to login
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            } else {
                showMessage('Failed to load data: ' + error.message, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const response = await authAPI.getUsers();
            if (response.success) {
                setUsers(response.data || []);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            showMessage('Failed to load users', 'error');
        }
    };

    const loadRoles = async () => {
        try {
            const response = await authAPI.getRoles();
            if (response.success) {
                setRoles(response.data || []);
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
            showMessage('Failed to load roles', 'error');
        }
    };

    const loadPermissions = async () => {
        try {
            const response = await authAPI.getPermissions();
            if (response.success) {
                setPermissions(response.data?.permissions || []);
            }
        } catch (error) {
            console.error('Failed to load permissions:', error);
            showMessage('Failed to load permissions', 'error');
        }
    };

    const loadSystemStats = async () => {
        try {
            const response = await authAPI.getSystemStats();
            if (response.success) {
                setSystemStats(response.data);
            }
        } catch (error) {
            console.error('Failed to load system stats:', error);
        }
    };

    const loadAuditLogs = async () => {
        try {
            const response = await authAPI.getAuditLogs({ limit: 50 });
            if (response.success) {
                setAuditLogs(response.data?.logs || []);
            }
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        }
    };

    const handleCreateUser = async () => {
        if (!userForm.name || !userForm.email || !userForm.password || !userForm.role_id) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.createUser(userForm);
            
            if (response.success) {
                await loadUsers(); // Reload users
                setShowAddUser(false);
                resetUserForm();
                showMessage('User created successfully!');
            }
        } catch (error) {
            showMessage('Failed to create user: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!userForm.name || !userForm.email || !userForm.role_id) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        try {
            setLoading(true);
            const updateData = { ...userForm };
            if (!updateData.password) {
                delete updateData.password; // Don't update password if empty
            }
            
            const response = await authAPI.updateUser(editingUser.id, updateData);
            
            if (response.success) {
                await loadUsers(); // Reload users
                setShowAddUser(false);
                setEditingUser(null);
                resetUserForm();
                showMessage('User updated successfully!');
            }
        } catch (error) {
            showMessage('Failed to update user: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        try {
            setLoading(true);
            const response = await authAPI.deleteUser(userId);
            
            if (response.success) {
                await loadUsers(); // Reload users
                showMessage('User deleted successfully!');
            }
        } catch (error) {
            showMessage('Failed to delete user: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setUserForm({
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            password: '' // Don't pre-fill password
        });
        setShowAddUser(true);
    };

    const resetUserForm = () => {
        setUserForm({
            name: '',
            email: '',
            role_id: '',
            password: ''
        });
        setEditingUser(null);
    };

    const handleRefresh = () => {
        loadInitialData();
    };

    // Filter users based on search and role
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'all' || user.role_name === selectedRole;
        return matchesSearch && matchesRole;
    });

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, perm) => {
        if (!acc[perm.category]) {
            acc[perm.category] = [];
        }
        acc[perm.category].push(perm);
        return acc;
    }, {});

    if (loading && users.length === 0) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading permissions data...</p>
            </div>
        );
    }

    // Check if user is authenticated
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser) {
        return (
            <div className={styles.loadingContainer}>
                <AlertCircle size={48} color="#dc2626" />
                <h2>Authentication Required</h2>
                <p>Please login to access the Access Controller</p>
                <button 
                    className={styles.loginBtn}
                    onClick={() => window.location.href = '/login'}
                >
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className={styles.permissionsManager}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Shield className={styles.headerIcon} />
                    <div>
                        <h1>Access Controller</h1>
                        <p>Manage users, roles, and permissions</p>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <button 
                        className={styles.refreshBtn}
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? styles.spinning : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className={styles.errorMessage}>
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}
            
            {success && (
                <div className={styles.successMessage}>
                    <CheckCircle size={16} />
                    {success}
                </div>
            )}

            {/* System Stats */}
            {systemStats && (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <Users size={24} />
                        <div>
                            <h3>{systemStats.users?.total_users || 0}</h3>
                            <p>Total Users</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <Eye size={24} />
                        <div>
                            <h3>{systemStats.users?.active_users || 0}</h3>
                            <p>Active Users</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <Shield size={24} />
                        <div>
                            <h3>{roles.length}</h3>
                            <p>Roles</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <Key size={24} />
                        <div>
                            <h3>{permissions.length}</h3>
                            <p>Permissions</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={16} />
                    Users ({users.length})
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'roles' ? styles.active : ''}`}
                    onClick={() => setActiveTab('roles')}
                >
                    <Shield size={16} />
                    Roles ({roles.length})
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'permissions' ? styles.active : ''}`}
                    onClick={() => setActiveTab('permissions')}
                >
                    <Key size={16} />
                    Permissions ({permissions.length})
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'audit' ? styles.active : ''}`}
                    onClick={() => {
                        setActiveTab('audit');
                        loadAuditLogs();
                    }}
                >
                    <Activity size={16} />
                    Audit Logs
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className={styles.tabContent}>
                    <div className={styles.tableHeader}>
                        <div className={styles.tableControls}>
                            <div className={styles.searchBox}>
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className={styles.roleFilter}
                            >
                                <option value="all">All Roles</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.name}>
                                        {role.display_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button 
                            className={styles.addBtn}
                            onClick={() => setShowAddUser(true)}
                        >
                            <Plus size={16} />
                            Add User
                        </button>
                    </div>

                    <div className={styles.table}>
                        <div className={styles.tableHead}>
                            <div>User</div>
                            <div>Role</div>
                            <div>Permissions</div>
                            <div>Status</div>
                            <div>Actions</div>
                        </div>
                        <div className={styles.tableBody}>
                            {filteredUsers.map(user => (
                                <div key={user.id} className={styles.tableRow}>
                                    <div className={styles.userInfo}>
                                        <div className={styles.userAvatar}>
                                            {user.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div className={styles.userName}>{user.name}</div>
                                            <div className={styles.userEmail}>{user.email}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <span 
                                            className={styles.roleTag}
                                            style={{ backgroundColor: user.role_color || '#6366f1' }}
                                        >
                                            {user.role_display_name || user.role_name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className={styles.permissionCount}>
                                            {user.permissions?.length || 0} permissions
                                        </span>
                                    </div>
                                    <div>
                                        <span className={`${styles.status} ${styles.active}`}>
                                            Active
                                        </span>
                                    </div>
                                    <div className={styles.actions}>
                                        <button 
                                            className={styles.actionBtn}
                                            onClick={() => handleEditUser(user)}
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button 
                                            className={`${styles.actionBtn} ${styles.danger}`}
                                            onClick={() => handleDeleteUser(user.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
                <div className={styles.tabContent}>
                    <div className={styles.rolesGrid}>
                        {roles.map(role => (
                            <div key={role.id} className={styles.roleCard}>
                                <div className={styles.roleHeader}>
                                    <div 
                                        className={styles.roleColor}
                                        style={{ backgroundColor: role.color }}
                                    ></div>
                                    <div>
                                        <h3>{role.display_name}</h3>
                                        <p>{role.description}</p>
                                    </div>
                                </div>
                                <div className={styles.roleStats}>
                                    <div>
                                        <span>{role.user_count || 0}</span>
                                        <small>Users</small>
                                    </div>
                                    <div>
                                        <span>{role.permission_count || 0}</span>
                                        <small>Permissions</small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
                <div className={styles.tabContent}>
                    <div className={styles.permissionsGrid}>
                        {Object.entries(groupedPermissions).map(([category, perms]) => (
                            <div key={category} className={styles.permissionCategory}>
                                <h3>{category}</h3>
                                <div className={styles.permissionsList}>
                                    {perms.map(permission => (
                                        <div key={permission.id} className={styles.permissionItem}>
                                            <div>
                                                <strong>{permission.display_name}</strong>
                                                <p>{permission.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'audit' && (
                <div className={styles.tabContent}>
                    <div className={styles.auditLogs}>
                        {auditLogs.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Activity size={48} />
                                <p>No audit logs available</p>
                            </div>
                        ) : (
                            auditLogs.map((log, index) => (
                                <div key={index} className={styles.auditEntry}>
                                    <div className={styles.auditTime}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </div>
                                    <div className={styles.auditUser}>
                                        {log.user_name || 'System'}
                                    </div>
                                    <div className={styles.auditAction}>
                                        {log.action} on {log.resource}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Add/Edit User Modal */}
            {showAddUser && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                            <button
                                className={styles.closeBtn}
                                onClick={() => {
                                    setShowAddUser(false);
                                    resetUserForm();
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
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
                                <label>Password {editingUser ? '(leave blank to keep current)' : '*'}</label>
                                <input
                                    type="password"
                                    value={userForm.password}
                                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="Enter password"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Role *</label>
                                <select
                                    value={userForm.role_id}
                                    onChange={(e) => setUserForm(prev => ({ ...prev, role_id: e.target.value }))}
                                >
                                    <option value="">Select a role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.display_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button
                                className={styles.saveBtn}
                                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                            </button>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => {
                                    setShowAddUser(false);
                                    resetUserForm();
                                }}
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