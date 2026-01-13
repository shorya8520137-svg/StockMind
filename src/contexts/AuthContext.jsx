"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { PermissionsAPI } from "../services/permissionsApi";

const AuthContext = createContext(null);

// Fallback users for development/demo (when API is not available)
const FALLBACK_USERS = {
    "admin@example.com": {
        password: "admin@123",
        role: "super_admin",
        name: "Super Admin",
        email: "admin@example.com"
    },
    "manager@example.com": {
        password: "manager@123",
        role: "manager",
        name: "Manager User",
        email: "manager@example.com"
    },
    "operator@example.com": {
        password: "operator@123",
        role: "operator",
        name: "Operator User",
        email: "operator@example.com"
    },
    "warehouse@example.com": {
        password: "warehouse@123",
        role: "warehouse_staff",
        name: "Warehouse Staff",
        email: "warehouse@example.com"
    },
    "viewer@example.com": {
        password: "viewer@123",
        role: "viewer",
        name: "Viewer User",
        email: "viewer@example.com"
    }
};

// Legacy support for existing users
const LEGACY_ROLE_MAPPING = {
    "admin": "super_admin",
    "super_admin": "super_admin",
    "manager": "manager",
    "operator": "operator",
    "warehouse_staff": "warehouse_staff",
    "viewer": "viewer"
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [apiAvailable, setApiAvailable] = useState(true);

    useEffect(() => {
        // Check if user is logged in from localStorage
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("authToken");
        
        if (storedUser && token) {
            try {
                const parsedUser = JSON.parse(storedUser);
                // Handle legacy role mapping for existing users
                if (parsedUser.role) {
                    parsedUser.role = LEGACY_ROLE_MAPPING[parsedUser.role] || parsedUser.role;
                }
                setUser(parsedUser);
                // Update localStorage with mapped role
                localStorage.setItem("user", JSON.stringify(parsedUser));
            } catch (e) {
                localStorage.removeItem("user");
                localStorage.removeItem("authToken");
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            // Try API login first
            if (apiAvailable) {
                try {
                    const response = await PermissionsAPI.login({ email, password });
                    
                    if (response.user && response.token) {
                        const userData = {
                            ...response.user,
                            role: LEGACY_ROLE_MAPPING[response.user.role] || response.user.role,
                            loginTime: new Date().toISOString()
                        };
                        
                        setUser(userData);
                        localStorage.setItem("user", JSON.stringify(userData));
                        
                        return { success: true, user: userData };
                    }
                } catch (apiError) {
                    console.warn('API login failed, falling back to local auth:', apiError);
                    setApiAvailable(false);
                }
            }
            
            // Fallback to local authentication
            const userCredentials = FALLBACK_USERS[email.toLowerCase()];
            
            if (userCredentials && userCredentials.password === password) {
                const userData = {
                    email: userCredentials.email,
                    role: LEGACY_ROLE_MAPPING[userCredentials.role] || userCredentials.role,
                    name: userCredentials.name,
                    loginTime: new Date().toISOString()
                };
                
                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
                
                // Log the login action locally if API is not available
                if (!apiAvailable) {
                    const loginLog = {
                        timestamp: new Date().toISOString(),
                        user: userData.email,
                        role: userData.role,
                        action: 'LOGIN',
                        resource: 'AUTH',
                        details: { success: true, source: 'local' }
                    };
                    
                    const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
                    auditLog.push(loginLog);
                    localStorage.setItem('auditLog', JSON.stringify(auditLog));
                }
                
                return { success: true, user: userData };
            }
            
            // Log failed login attempt
            const failedLoginLog = {
                timestamp: new Date().toISOString(),
                user: email,
                role: 'unknown',
                action: 'LOGIN_FAILED',
                resource: 'AUTH',
                details: { success: false, reason: 'Invalid credentials', source: apiAvailable ? 'api' : 'local' }
            };
            
            if (!apiAvailable) {
                const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
                auditLog.push(failedLoginLog);
                localStorage.setItem('auditLog', JSON.stringify(auditLog));
            }
            
            return { success: false, error: "Invalid credentials" };
            
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: "Login failed. Please try again." };
        }
    };

    const logout = async () => {
        try {
            if (user && apiAvailable) {
                try {
                    await PermissionsAPI.logout();
                } catch (apiError) {
                    console.warn('API logout failed:', apiError);
                }
            }
            
            if (user && !apiAvailable) {
                // Log the logout action locally
                const logoutLog = {
                    timestamp: new Date().toISOString(),
                    user: user.email,
                    role: user.role,
                    action: 'LOGOUT',
                    resource: 'AUTH',
                    details: { success: true, source: 'local' }
                };
                
                const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
                auditLog.push(logoutLog);
                localStorage.setItem('auditLog', JSON.stringify(auditLog));
            }
            
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("authToken");
        } catch (error) {
            console.error('Logout error:', error);
            // Clear local storage anyway
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("authToken");
        }
    };

    const hasPermission = (permission) => {
        if (!user) return false;
        // This will be handled by PermissionsContext
        // Keeping for backward compatibility
        if (user.role === "super_admin") return true;
        return false;
    };

    const switchRole = (newRole) => {
        if (!user || user.role !== "super_admin") return false;
        
        const updatedUser = { ...user, role: newRole };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Log role switch
        const switchLog = {
            timestamp: new Date().toISOString(),
            user: user.email,
            role: user.role,
            action: 'ROLE_SWITCH',
            resource: 'AUTH',
            details: { oldRole: user.role, newRole, source: apiAvailable ? 'api' : 'local' }
        };
        
        if (!apiAvailable) {
            const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
            auditLog.push(switchLog);
            localStorage.setItem('auditLog', JSON.stringify(auditLog));
        }
        
        return true;
    };

    return (
        <AuthContext.Provider
            value={{ 
                user, 
                login, 
                logout, 
                loading, 
                hasPermission, 
                switchRole,
                apiAvailable,
                availableUsers: Object.keys(FALLBACK_USERS).map(email => ({
                    email,
                    role: FALLBACK_USERS[email].role,
                    name: FALLBACK_USERS[email].name
                }))
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}


