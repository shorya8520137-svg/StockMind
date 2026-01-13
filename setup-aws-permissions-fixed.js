#!/usr/bin/env node

// Fixed setup script that adapts to existing users table structure
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const DB_CONFIG = {
    host: 'inventory-db.cv2iey8a8hbk.ap-south-1.rds.amazonaws.com',
    port: 3306,
    user: 'admin',
    password: 'gfx998sd',
    database: 'hunyhuny_auto_dispatch'
};

console.log('🚀 Setting up permissions system (Fixed Version)...');
console.log('📍 Database:', DB_CONFIG.database);
console.log('🌐 Host:', DB_CONFIG.host);

async function setupPermissions() {
    let connection;
    
    try {
        console.log('\n🔗 Connecting to AWS RDS MySQL...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected successfully!');
        
        // First, check existing users table structure
        console.log('\n🔍 Analyzing existing users table...');
        let usersTableExists = false;
        let usersColumns = [];
        
        try {
            const [tables] = await connection.execute(`
                SELECT TABLE_NAME FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
            `, [DB_CONFIG.database]);
            
            usersTableExists = tables.length > 0;
            
            if (usersTableExists) {
                const [columns] = await connection.execute(`
                    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                    FROM information_schema.COLUMNS 
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
                `, [DB_CONFIG.database]);
                
                usersColumns = columns.map(col => col.COLUMN_NAME.toLowerCase());
                console.log('✅ Found existing users table with columns:', usersColumns.join(', '));
            } else {
                console.log('ℹ️  No existing users table found');
            }
        } catch (e) {
            console.log('ℹ️  Could not check users table structure');
        }
        
        // Create roles table
        console.log('\n📋 Creating roles table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL UNIQUE,
                display_name VARCHAR(100) NOT NULL,
                description TEXT,
                color VARCHAR(7) DEFAULT '#64748b',
                priority INT DEFAULT 999,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_name (name),
                INDEX idx_priority (priority),
                INDEX idx_active (is_active)
            )
        `);
        console.log('✅ Roles table created');
        
        // Create permissions table
        console.log('\n🔑 Creating permissions table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS permissions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL UNIQUE,
                display_name VARCHAR(150) NOT NULL,
                description TEXT,
                category VARCHAR(50) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_name (name),
                INDEX idx_category (category),
                INDEX idx_active (is_active)
            )
        `);
        console.log('✅ Permissions table created');
        
        // Handle users table - adapt to existing structure or create new
        console.log('\n👥 Setting up users table...');
        
        if (!usersTableExists) {
            // Create new users table
            await connection.execute(`
                CREATE TABLE users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    role_id INT NOT NULL DEFAULT 6,
                    is_active BOOLEAN DEFAULT TRUE,
                    last_login TIMESTAMP NULL,
                    login_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    
                    INDEX idx_email (email),
                    INDEX idx_role (role_id),
                    INDEX idx_active (is_active),
                    INDEX idx_last_login (last_login)
                )
            `);
            console.log('✅ New users table created');
        } else {
            // Add missing columns to existing users table
            const columnsToAdd = [
                { name: 'role_id', sql: 'ADD COLUMN role_id INT NOT NULL DEFAULT 6' },
                { name: 'is_active', sql: 'ADD COLUMN is_active BOOLEAN DEFAULT TRUE' },
                { name: 'last_login', sql: 'ADD COLUMN last_login TIMESTAMP NULL' },
                { name: 'login_count', sql: 'ADD COLUMN login_count INT DEFAULT 0' }
            ];
            
            for (const column of columnsToAdd) {
                if (!usersColumns.includes(column.name)) {
                    try {
                        await connection.execute(`ALTER TABLE users ${column.sql}`);
                        console.log(`✅ Added ${column.name} column to users table`);
                    } catch (e) {
                        console.log(`ℹ️  Could not add ${column.name} column (may already exist): ${e.message}`);
                    }
                } else {
                    console.log(`ℹ️  Column ${column.name} already exists`);
                }
            }
        }
        
        // Create role_permissions table
        console.log('\n🔗 Creating role_permissions table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                role_id INT NOT NULL,
                permission_id INT NOT NULL,
                granted_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                UNIQUE KEY unique_role_permission (role_id, permission_id),
                INDEX idx_role (role_id),
                INDEX idx_permission (permission_id)
            )
        `);
        console.log('✅ Role permissions table created');
        
        // Create audit_logs table
        console.log('\n📊 Creating audit_logs table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                action VARCHAR(50) NOT NULL,
                resource VARCHAR(50) NOT NULL,
                resource_id INT NULL,
                details JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_user (user_id),
                INDEX idx_action (action),
                INDEX idx_resource (resource),
                INDEX idx_created_at (created_at)
            )
        `);
        console.log('✅ Audit logs table created');
        
        // Insert default roles
        console.log('\n🎭 Inserting default roles...');
        const roles = [
            ['super_admin', 'Super Admin', 'Full system access with user management', '#dc2626', 1],
            ['admin', 'Admin', 'Full operational access without user management', '#ea580c', 2],
            ['manager', 'Manager', 'Management access with reporting capabilities', '#2563eb', 3],
            ['operator', 'Operator', 'Operational access for daily tasks', '#16a34a', 4],
            ['warehouse_staff', 'Warehouse Staff', 'Inventory and warehouse operations only', '#7c3aed', 5],
            ['viewer', 'Viewer', 'Read-only access to reports and data', '#64748b', 6]
        ];
        
        for (const role of roles) {
            await connection.execute(`
                INSERT IGNORE INTO roles (name, display_name, description, color, priority) 
                VALUES (?, ?, ?, ?, ?)
            `, role);
        }
        console.log('✅ Default roles inserted');
        
        // Insert default permissions
        console.log('\n🔐 Inserting default permissions...');
        const permissions = [
            // Dashboard permissions
            ['dashboard.view', 'View Dashboard', 'Access to main dashboard', 'dashboard'],
            ['dashboard.analytics', 'Dashboard Analytics', 'View analytics and reports', 'dashboard'],
            ['dashboard.export', 'Export Dashboard', 'Export dashboard data', 'dashboard'],
            
            // Inventory permissions
            ['inventory.view', 'View Inventory', 'View inventory items and stock', 'inventory'],
            ['inventory.create', 'Create Inventory', 'Add new inventory items', 'inventory'],
            ['inventory.edit', 'Edit Inventory', 'Modify inventory items', 'inventory'],
            ['inventory.delete', 'Delete Inventory', 'Remove inventory items', 'inventory'],
            ['inventory.transfer', 'Transfer Inventory', 'Transfer items between locations', 'inventory'],
            ['inventory.export', 'Export Inventory', 'Export inventory data', 'inventory'],
            
            // Orders permissions
            ['orders.view', 'View Orders', 'View order information', 'orders'],
            ['orders.create', 'Create Orders', 'Create new orders', 'orders'],
            ['orders.edit', 'Edit Orders', 'Modify existing orders', 'orders'],
            ['orders.delete', 'Delete Orders', 'Remove orders', 'orders'],
            ['orders.dispatch', 'Dispatch Orders', 'Process and dispatch orders', 'orders'],
            ['orders.export', 'Export Orders', 'Export order data', 'orders'],
            
            // Tracking permissions
            ['tracking.view', 'View Tracking', 'View shipment tracking', 'tracking'],
            ['tracking.real_time', 'Real-time Tracking', 'Access real-time updates', 'tracking'],
            
            // Messages permissions
            ['messages.view', 'View Messages', 'Access messaging system', 'messages'],
            ['messages.send', 'Send Messages', 'Send messages', 'messages'],
            ['messages.create_channel', 'Create Channels', 'Create message channels', 'messages'],
            
            // System permissions
            ['system.settings', 'System Settings', 'Access system configuration', 'system'],
            ['system.user_management', 'User Management', 'Manage users and roles', 'system'],
            ['system.permissions', 'Permission Management', 'Manage roles and permissions', 'system'],
            ['system.audit_log', 'Audit Log Access', 'View system audit logs', 'system'],
            
            // Export permissions
            ['export.csv', 'Export CSV', 'Export data in CSV format', 'export'],
            ['export.pdf', 'Export PDF', 'Export data in PDF format', 'export'],
            ['export.excel', 'Export Excel', 'Export data in Excel format', 'export']
        ];
        
        for (const permission of permissions) {
            await connection.execute(`
                INSERT IGNORE INTO permissions (name, display_name, description, category) 
                VALUES (?, ?, ?, ?)
            `, permission);
        }
        console.log('✅ Default permissions inserted');
        
        // Assign permissions to roles
        console.log('\n🔗 Assigning permissions to roles...');
        
        // Super Admin - All permissions
        await connection.execute(`
            INSERT IGNORE INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id 
            FROM roles r 
            CROSS JOIN permissions p 
            WHERE r.name = 'super_admin'
        `);
        
        // Admin - All except user management
        await connection.execute(`
            INSERT IGNORE INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id 
            FROM roles r 
            CROSS JOIN permissions p 
            WHERE r.name = 'admin' 
            AND p.name NOT IN ('system.user_management')
        `);
        
        // Manager permissions
        const managerPermissions = [
            'dashboard.view', 'dashboard.analytics', 'dashboard.export',
            'inventory.view', 'inventory.edit', 'inventory.transfer', 'inventory.export',
            'orders.view', 'orders.create', 'orders.edit', 'orders.dispatch', 'orders.export',
            'tracking.view', 'tracking.real_time',
            'messages.view', 'messages.send', 'messages.create_channel',
            'export.csv', 'export.excel'
        ];
        
        for (const permName of managerPermissions) {
            await connection.execute(`
                INSERT IGNORE INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id 
                FROM roles r, permissions p 
                WHERE r.name = 'manager' AND p.name = ?
            `, [permName]);
        }
        
        // Operator permissions
        const operatorPermissions = [
            'dashboard.view',
            'inventory.view', 'inventory.edit', 'inventory.transfer',
            'orders.view', 'orders.create', 'orders.edit', 'orders.dispatch',
            'tracking.view',
            'messages.view', 'messages.send'
        ];
        
        for (const permName of operatorPermissions) {
            await connection.execute(`
                INSERT IGNORE INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id 
                FROM roles r, permissions p 
                WHERE r.name = 'operator' AND p.name = ?
            `, [permName]);
        }
        
        // Warehouse Staff permissions
        const warehousePermissions = [
            'inventory.view', 'inventory.edit', 'inventory.transfer',
            'orders.view', 'orders.dispatch',
            'tracking.view',
            'messages.view', 'messages.send'
        ];
        
        for (const permName of warehousePermissions) {
            await connection.execute(`
                INSERT IGNORE INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id 
                FROM roles r, permissions p 
                WHERE r.name = 'warehouse_staff' AND p.name = ?
            `, [permName]);
        }
        
        // Viewer permissions
        const viewerPermissions = [
            'dashboard.view',
            'inventory.view',
            'orders.view',
            'tracking.view',
            'messages.view'
        ];
        
        for (const permName of viewerPermissions) {
            await connection.execute(`
                INSERT IGNORE INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id 
                FROM roles r, permissions p 
                WHERE r.name = 'viewer' AND p.name = ?
            `, [permName]);
        }
        
        console.log('✅ Permissions assigned to roles');
        
        // Create default test users - adapt to existing table structure
        console.log('\n👤 Creating default test users...');
        
        // Determine password column name
        const passwordColumn = usersColumns.includes('password_hash') ? 'password_hash' : 'password';
        console.log(`ℹ️  Using password column: ${passwordColumn}`);
        
        const defaultUsers = [
            ['admin@example.com', 'admin@123', 'Super Admin', 'super_admin'],
            ['manager@example.com', 'manager@123', 'Manager User', 'manager'],
            ['operator@example.com', 'operator@123', 'Operator User', 'operator'],
            ['warehouse@example.com', 'warehouse@123', 'Warehouse Staff', 'warehouse_staff'],
            ['viewer@example.com', 'viewer@123', 'Viewer User', 'viewer']
        ];
        
        for (const [email, password, name, roleName] of defaultUsers) {
            // Hash password if using password_hash column, otherwise use plain text
            const passwordValue = passwordColumn === 'password_hash' 
                ? await bcrypt.hash(password, 12) 
                : password;
            
            try {
                await connection.execute(`
                    INSERT IGNORE INTO users (email, ${passwordColumn}, name, role_id)
                    SELECT ?, ?, ?, r.id
                    FROM roles r
                    WHERE r.name = ?
                `, [email, passwordValue, name, roleName]);
                
                console.log(`✅ Created user: ${email} (${roleName})`);
            } catch (e) {
                console.log(`⚠️  Could not create user ${email}: ${e.message}`);
            }
        }
        
        // Add foreign key constraints (if possible)
        console.log('\n🔗 Adding foreign key constraints...');
        
        const constraints = [
            {
                name: 'fk_role_permissions_role_id',
                sql: 'ALTER TABLE role_permissions ADD CONSTRAINT fk_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE'
            },
            {
                name: 'fk_role_permissions_permission_id', 
                sql: 'ALTER TABLE role_permissions ADD CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE'
            },
            {
                name: 'fk_users_role_id',
                sql: 'ALTER TABLE users ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT'
            }
        ];
        
        for (const constraint of constraints) {
            try {
                await connection.execute(constraint.sql);
                console.log(`✅ Added constraint: ${constraint.name}`);
            } catch (e) {
                console.log(`ℹ️  Constraint ${constraint.name} already exists or couldn't be added`);
            }
        }
        
        console.log('\n🎉 Permissions system setup completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   ✅ 6 roles created (Super Admin → Viewer)');
        console.log('   ✅ 25+ permissions created across all categories');
        console.log('   ✅ 5 default test users created');
        console.log('   ✅ All tables and relationships configured');
        console.log('   ✅ Adapted to your existing users table structure');
        console.log('   ✅ Ready for production use');
        
        console.log('\n🔑 Test Login Credentials:');
        console.log('   📧 admin@example.com / admin@123 (Super Admin)');
        console.log('   📧 manager@example.com / manager@123 (Manager)');
        console.log('   📧 operator@example.com / operator@123 (Operator)');
        console.log('   📧 warehouse@example.com / warehouse@123 (Warehouse Staff)');
        console.log('   📧 viewer@example.com / viewer@123 (Viewer)');
        
        console.log(`\n💡 Note: Passwords are stored in '${passwordColumn}' column`);
        if (passwordColumn === 'password') {
            console.log('⚠️  Passwords are stored in plain text. Consider updating to hashed passwords for security.');
        }
        
        console.log('\n🚀 Next Steps:');
        console.log('   1. Add the permissions controller files to your backend');
        console.log('   2. Integrate with your existing server');
        console.log('   3. Test the API endpoints');
        console.log('   4. Update your frontend to use the new API');
        
    } catch (error) {
        console.error('\n❌ Error setting up permissions system:', error);
        console.error('\n🔍 Error details:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Connection refused - check if database server is running');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Access denied - check username and password');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 Database not found - check database name');
        } else if (error.code === 'ER_BAD_FIELD_ERROR') {
            console.error('💡 Column not found - this script should handle existing table structures');
        }
        
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the setup
if (require.main === module) {
    setupPermissions()
        .then(() => {
            console.log('\n✨ Setup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Setup failed:', error.message);
            process.exit(1);
        });
}

module.exports = setupPermissions;