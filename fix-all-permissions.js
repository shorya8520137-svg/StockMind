#!/usr/bin/env node

// Complete fix for permissions system
// Run with: node fix-all-permissions.js

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing All Permissions System Issues...\n');

try {
    // 1. Fix PermissionsController.js
    console.log('1. Fixing PermissionsController.js...');
    const controllerPath = path.join(__dirname, 'controllers', 'permissionsController.js');
    let controllerContent = fs.readFileSync(controllerPath, 'utf8');
    
    // Fix login method destructuring
    controllerContent = controllerContent.replace(
        /const result = await db\.execute\(`[\s\S]*?\`, \[email\]\);\s*const users = Array\.isArray\(result\) \? result\[0\] : result;/,
        `const [users] = await db.execute(\`
                SELECT u.*, r.name as role_name, r.display_name as role_display_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.email = ?
            \`, [email]);`
    );
    
    // Fix permissions query destructuring
    controllerContent = controllerContent.replace(
        /const permResult = await db\.execute\(`[\s\S]*?\`, \[user\.role_id\]\);\s*const permissions = Array\.isArray\(permResult\) \? permResult\[0\] : permResult;/,
        `const [permissions] = await db.execute(\`
                SELECT p.name, p.display_name, p.category
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ? AND p.is_active = true
            \`, [user.role_id]);`
    );
    
    fs.writeFileSync(controllerPath, controllerContent);
    console.log('✅ Fixed PermissionsController.js');
    
    // 2. Fix middleware/auth.js formatting
    console.log('2. Fixing middleware/auth.js...');
    const authPath = path.join(__dirname, 'middleware', 'auth.js');
    const cleanAuthContent = `const jwt = require('jsonwebtoken');
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
            const [permissions] = await db.execute(\`
                SELECT p.name
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN users u ON rp.role_id = u.role_id
                WHERE u.id = ? AND p.is_active = true
            \`, [req.user.userId]);

            const userPermissions = permissions.map(p => p.name);

            if (userPermissions.includes(requiredPermission)) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: \`Insufficient permissions. Required: \${requiredPermission}\`
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
            const [permissions] = await db.execute(\`
                SELECT p.name
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN users u ON rp.role_id = u.role_id
                WHERE u.id = ? AND p.is_active = true
            \`, [req.user.userId]);

            const userPermissions = permissions.map(p => p.name);

            // Check if user has any of the required permissions
            const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

            if (hasPermission) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: \`Insufficient permissions. Required one of: \${requiredPermissions.join(', ')}\`
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
                    message: \`Insufficient role. Required one of: \${requiredRoles.join(', ')}\`
                });
            }
        } else {
            if (userRole === requiredRoles) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: \`Insufficient role. Required: \${requiredRoles}\`
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
        await db.execute(\`
            INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        \`, [
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
};`;
    
    fs.writeFileSync(authPath, cleanAuthContent);
    console.log('✅ Fixed middleware/auth.js');
    
    // 3. Create test user setup
    console.log('3. Creating test user setup...');
    const setupUserContent = `-- Setup test user for permissions system
-- Run this in MySQL: mysql -u root -p hunyhuny_auto_dispatch < setup-test-user.sql

USE hunyhuny_auto_dispatch;

-- Ensure test user exists with correct password
INSERT INTO users (name, email, password, role_id, status) 
SELECT 'Test Admin', 'admin@example.com', 'password123', r.id, 'active'
FROM roles r 
WHERE r.name = 'super_admin'
ON DUPLICATE KEY UPDATE 
    password = 'password123',
    role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1),
    status = 'active';

-- Verify user was created
SELECT u.*, r.name as role_name 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'admin@example.com';`;
    
    fs.writeFileSync('setup-test-user.sql', setupUserContent);
    console.log('✅ Created setup-test-user.sql');
    
    console.log('\n🎉 All fixes applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: mysql -u root -p hunyhuny_auto_dispatch < setup-test-user.sql');
    console.log('2. Test: node test-backend-auth.js');
    console.log('3. Start server: node server.js');
    
} catch (error) {
    console.error('❌ Error applying fixes:', error.message);
    process.exit(1);
}