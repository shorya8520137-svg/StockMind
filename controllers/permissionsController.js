const db = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class PermissionsController {
    // ================= AUTHENTICATION ================= //
    
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }
            
            // Get user with role information
            const result = await db.execute(`
                SELECT u.*, r.name as role_name, r.display_name as role_display_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.email = ?
            `, [email]);
            
            const users = Array.isArray(result) ? result[0] : result;
            
            if (!users || users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            const user = users[0];
            
            // Verify password - check both password and password_hash columns
            let isValidPassword = false;
            if (user.password_hash) {
                isValidPassword = await bcrypt.compare(password, user.password_hash);
            } else if (user.password) {
                // For plain text passwords (temporary - should be hashed)
                isValidPassword = (password === user.password);
            }
            
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            // Get user permissions
            const permResult = await db.execute(`
                SELECT p.name, p.display_name, p.category
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ? AND p.is_active = true
            `, [user.role_id]);
            
            const permissions = Array.isArray(permResult) ? permResult[0] : permResult;
            
            // Update last login
            await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
            
            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email, 
                    role: user.role_name,
                    roleId: user.role_id
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            
            // Log audit
            await this.createAuditLog(user.id, 'LOGIN', 'USER', user.id, { ip: req.ip });
            
            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role_name,
                    roleDisplayName: user.role_display_name,
                    permissions: permissions.map(p => p.name)
                }
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    static async logout(req, res) {
        try {
            // Log audit
            await this.createAuditLog(req.user?.userId, 'LOGOUT', 'USER', req.user?.userId, { ip: req.ip });
            
            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    static async refreshToken(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            
            // Generate new token
            const newToken = jwt.sign(
                { 
                    userId: decoded.userId, 
                    email: decoded.email, 
                    role: decoded.role,
                    roleId: decoded.roleId
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                token: newToken
            });
            
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    }
    
    // ================= USER MANAGEMENT ================= //
    
    static async getUsers(req, res) {
        try {
            const [users] = await db.execute(`
                SELECT u.id, u.name, u.email, u.status, u.last_login, u.created_at,
                       r.name as role_name, r.display_name as role_display_name, r.color as role_color
                FROM users u
                JOIN roles r ON u.role_id = r.id
                ORDER BY u.created_at DESC
            `);
            
            // Get permissions for each user
            for (let user of users) {
                const [permissions] = await db.execute(`
                    SELECT p.name
                    FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permission_id
                    WHERE rp.role_id = ? AND p.is_active = true
                `, [user.role_id]);
                
                user.permissions = permissions.map(p => p.name);
            }
            
            res.json({
                success: true,
                data: users
            });
            
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users'
            });
        }
    }
    
    static async getUserById(req, res) {
        try {
            const { userId } = req.params;
            
            const [users] = await db.execute(`
                SELECT u.id, u.name, u.email, u.status, u.last_login, u.created_at,
                       r.name as role_name, r.display_name as role_display_name, r.color as role_color
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = ?
            `, [userId]);
            
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            const user = users[0];
            
            // Get user permissions
            const [permissions] = await db.execute(`
                SELECT p.name, p.display_name, p.category
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ? AND p.is_active = true
            `, [user.role_id]);
            
            user.permissions = permissions;
            
            res.json({
                success: true,
                data: user
            });
            
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user'
            });
        }
    }
    
    static async createUser(req, res) {
        try {
            const { name, email, password, roleId, status = 'active' } = req.body;
            
            if (!name || !email || !password || !roleId) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, password, and role are required'
                });
            }
            
            // Check if email already exists
            const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
            
            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);
            
            // Create user
            const [result] = await db.execute(`
                INSERT INTO users (name, email, password_hash, role_id, status)
                VALUES (?, ?, ?, ?, ?)
            `, [name, email, passwordHash, roleId, status]);
            
            // Log audit
            await this.createAuditLog(req.user?.userId, 'CREATE', 'USER', result.insertId, {
                name, email, roleId, status
            });
            
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: { id: result.insertId }
            });
            
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create user'
            });
        }
    }
    
    static async updateUser(req, res) {
        try {
            const { userId } = req.params;
            const { name, email, roleId, status } = req.body;
            
            // Check if user exists
            const [existingUsers] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
            if (existingUsers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Update user
            await db.execute(`
                UPDATE users 
                SET name = ?, email = ?, role_id = ?, status = ?, updated_at = NOW()
                WHERE id = ?
            `, [name, email, roleId, status, userId]);
            
            // Log audit
            await this.createAuditLog(req.user?.userId, 'UPDATE', 'USER', userId, {
                name, email, roleId, status
            });
            
            res.json({
                success: true,
                message: 'User updated successfully'
            });
            
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user'
            });
        }
    }
    
    static async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            
            // Check if user exists
            const [existingUsers] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
            if (existingUsers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Delete user
            await db.execute('DELETE FROM users WHERE id = ?', [userId]);
            
            // Log audit
            await this.createAuditLog(req.user?.userId, 'DELETE', 'USER', userId, {});
            
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
            
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete user'
            });
        }
    }
    
    // ================= ROLE MANAGEMENT ================= //
    
    static async getRoles(req, res) {
        try {
            const [roles] = await db.execute(`
                SELECT r.*, 
                       COUNT(u.id) as user_count,
                       COUNT(rp.permission_id) as permission_count
                FROM roles r
                LEFT JOIN users u ON r.id = u.role_id
                LEFT JOIN role_permissions rp ON r.id = rp.role_id
                WHERE r.is_active = true
                GROUP BY r.id
                ORDER BY r.name
            `);
            
            // Get permissions for each role
            for (let role of roles) {
                const [permissions] = await db.execute(`
                    SELECT p.name, p.display_name, p.category
                    FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permission_id
                    WHERE rp.role_id = ? AND p.is_active = true
                    ORDER BY p.category, p.name
                `, [role.id]);
                
                role.permissions = permissions;
            }
            
            res.json({
                success: true,
                data: roles
            });
            
        } catch (error) {
            console.error('Get roles error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch roles'
            });
        }
    }
    
    static async createRole(req, res) {
        try {
            const { name, displayName, description, color = '#6366f1', permissionIds = [] } = req.body;
            
            if (!name || !displayName) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and display name are required'
                });
            }
            
            // Create role
            const [result] = await db.execute(`
                INSERT INTO roles (name, display_name, description, color)
                VALUES (?, ?, ?, ?)
            `, [name, displayName, description, color]);
            
            const roleId = result.insertId;
            
            // Assign permissions
            if (permissionIds.length > 0) {
                const values = permissionIds.map(permId => `(${roleId}, ${permId})`).join(',');
                await db.execute(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`);
            }
            
            // Log audit
            await this.createAuditLog(req.user?.userId, 'CREATE', 'ROLE', roleId, {
                name, displayName, description, color, permissionIds
            });
            
            res.status(201).json({
                success: true,
                message: 'Role created successfully',
                data: { id: roleId }
            });
            
        } catch (error) {
            console.error('Create role error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create role'
            });
        }
    }
    
    // ================= PERMISSION MANAGEMENT ================= //
    
    static async getPermissions(req, res) {
        try {
            const [permissions] = await db.execute(`
                SELECT * FROM permissions 
                WHERE is_active = true 
                ORDER BY category, name
            `);
            
            // Group by category
            const groupedPermissions = permissions.reduce((acc, perm) => {
                if (!acc[perm.category]) {
                    acc[perm.category] = [];
                }
                acc[perm.category].push(perm);
                return acc;
            }, {});
            
            res.json({
                success: true,
                data: {
                    permissions,
                    grouped: groupedPermissions
                }
            });
            
        } catch (error) {
            console.error('Get permissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch permissions'
            });
        }
    }
    
    // ================= AUDIT LOG ================= //
    
    static async getAuditLogs(req, res) {
        try {
            const { page = 1, limit = 50, userId, action, resource } = req.query;
            const offset = (page - 1) * limit;
            
            let whereClause = '1=1';
            let params = [];
            
            if (userId) {
                whereClause += ' AND al.user_id = ?';
                params.push(userId);
            }
            
            if (action) {
                whereClause += ' AND al.action = ?';
                params.push(action);
            }
            
            if (resource) {
                whereClause += ' AND al.resource = ?';
                params.push(resource);
            }
            
            const [logs] = await db.execute(`
                SELECT al.*, u.name as user_name, u.email as user_email
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE ${whereClause}
                ORDER BY al.created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), parseInt(offset)]);
            
            const [countResult] = await db.execute(`
                SELECT COUNT(*) as total
                FROM audit_logs al
                WHERE ${whereClause}
            `, params);
            
            res.json({
                success: true,
                data: {
                    logs,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: countResult[0].total,
                        pages: Math.ceil(countResult[0].total / limit)
                    }
                }
            });
            
        } catch (error) {
            console.error('Get audit logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch audit logs'
            });
        }
    }
    
    // ================= SYSTEM STATS ================= //
    
    static async getSystemStats(req, res) {
        try {
            const [userStats] = await db.execute(`
                SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
                    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_users
                FROM users
            `);
            
            const [roleStats] = await db.execute(`
                SELECT r.name, r.display_name, COUNT(u.id) as user_count
                FROM roles r
                LEFT JOIN users u ON r.id = u.role_id
                WHERE r.is_active = true
                GROUP BY r.id
                ORDER BY user_count DESC
            `);
            
            const [permissionStats] = await db.execute(`
                SELECT category, COUNT(*) as permission_count
                FROM permissions
                WHERE is_active = true
                GROUP BY category
                ORDER BY permission_count DESC
            `);
            
            const [recentActivity] = await db.execute(`
                SELECT COUNT(*) as activity_count
                FROM audit_logs
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `);
            
            res.json({
                success: true,
                data: {
                    users: userStats[0],
                    roles: roleStats,
                    permissions: permissionStats,
                    recentActivity: recentActivity[0].activity_count
                }
            });
            
        } catch (error) {
            console.error('Get system stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch system stats'
            });
        }
    }
    
    // ================= HELPER METHODS ================= //
    
    static async createAuditLog(userId, action, resource, resourceId, details) {
        try {
            await db.execute(`
                INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
                VALUES (?, ?, ?, ?, ?)
            `, [userId, action, resource, resourceId, JSON.stringify(details)]);
        } catch (error) {
            console.error('Create audit log error:', error);
        }
    }
}

module.exports = PermissionsController;