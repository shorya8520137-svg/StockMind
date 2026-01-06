const jwt = require('jsonwebtoken');
const db = require('../db/connection');

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
};

// Permission checking middleware
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            // Super admin has all permissions
            if (req.user.role === 'SUPER_ADMIN') {
                return next();
            }

            // Get user permissions from database
            const [permissions] = await db.execute(`
                SELECT p.name
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN users u ON rp.role_id = u.role_id
                WHERE u.id = ? AND p.is_active = true
            `, [req.user.userId]);

            const userPermissions = permissions.map(p => p.name);

            if (userPermissions.includes(requiredPermission)) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: `Insufficient permissions. Required: ${requiredPermission}`
                });
            }
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed'
            });
        }
    };
};

// Multiple permissions check (user needs at least one)
const checkAnyPermission = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            // Super admin has all permissions
            if (req.user.role === 'SUPER_ADMIN') {
                return next();
            }

            // Get user permissions from database
            const [permissions] = await db.execute(`
                SELECT p.name
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN users u ON rp.role_id = u.role_id
                WHERE u.id = ? AND p.is_active = true
            `, [req.user.userId]);

            const userPermissions = permissions.map(p => p.name);

            // Check if user has any of the required permissions
            const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

            if (hasPermission) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: `Insufficient permissions. Required one of: ${requiredPermissions.join(', ')}`
                });
            }
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed'
            });
        }
    };
};

// Role checking middleware
const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        const userRole = req.user.role;

        if (Array.isArray(requiredRoles)) {
            if (requiredRoles.includes(userRole)) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: `Insufficient role. Required one of: ${requiredRoles.join(', ')}`
                });
            }
        } else {
            if (userRole === requiredRoles) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: `Insufficient role. Required: ${requiredRoles}`
                });
            }
        }
    };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
};

// Audit logging helper
const createAuditLog = async (userId, action, resource, resourceId, details, req) => {
    try {
        await db.execute(`
            INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            userId,
            action,
            resource,
            resourceId,
            JSON.stringify(details),
            req?.ip || req?.connection?.remoteAddress,
            req?.get('User-Agent')
        ]);
    } catch (error) {
        console.error('Create audit log error:', error);
    }
};

module.exports = {
    authenticateToken,
    checkPermission,
    checkAnyPermission,
    checkRole,
    optionalAuth,
    createAuditLog
};