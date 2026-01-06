-- =====================================================
-- FRESH PERMISSIONS SYSTEM SETUP
-- Clean, professional permissions for inventory management
-- Run with: mysql -u root -p hunyhuny_auto_dispatch < fresh-permissions-setup.sql
-- =====================================================

USE hunyhuny_auto_dispatch;

-- =====================================================
-- CREATE CORE TABLES
-- =====================================================

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_active (is_active)
);

-- 2. PERMISSIONS TABLE
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
);

-- 3. ROLE_PERMISSIONS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    INDEX idx_role (role_id),
    INDEX idx_permission (permission_id)
);

-- 4. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(50) NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource),
    INDEX idx_created (created_at)
);

-- =====================================================
-- INSERT ROLES (6 PROFESSIONAL ROLES)
-- =====================================================

INSERT IGNORE INTO roles (name, display_name, description, color) VALUES
('super_admin', 'Super Admin', 'Complete system control with all administrative privileges', '#dc2626'),
('admin', 'Admin', 'Departmental control with operational management', '#ea580c'),
('manager', 'Manager', 'Operational control with limited administrative access', '#ca8a04'),
('operator', 'Operator', 'Task execution with limited modification rights', '#16a34a'),
('warehouse_staff', 'Warehouse Staff', 'Warehouse-specific operations with location-based access', '#2563eb'),
('viewer', 'Viewer', 'Information access without modification rights', '#7c3aed');

-- =====================================================
-- INSERT PERMISSIONS (ORGANIZED BY BUSINESS FUNCTION)
-- =====================================================

-- DASHBOARD PERMISSIONS (5)
INSERT IGNORE INTO permissions (name, display_name, description, category) VALUES
('DASHBOARD_VIEW', 'View Dashboard', 'Access to main dashboard and overview', 'DASHBOARD'),
('DASHBOARD_STATS', 'View Statistics', 'View dashboard statistics and metrics', 'DASHBOARD'),
('DASHBOARD_CHARTS', 'View Charts', 'Access to dashboard charts and analytics', 'DASHBOARD'),
('DASHBOARD_EXPORT', 'Export Dashboard', 'Export dashboard data and reports', 'DASHBOARD'),
('DASHBOARD_CUSTOMIZE', 'Customize Dashboard', 'Customize dashboard layout and widgets', 'DASHBOARD'),

-- INVENTORY PERMISSIONS (12)
('INVENTORY_VIEW', 'View Inventory', 'View inventory items and stock levels', 'INVENTORY'),
('INVENTORY_CREATE', 'Add Inventory', 'Add new inventory items and stock', 'INVENTORY'),
('INVENTORY_EDIT', 'Edit Inventory', 'Modify existing inventory items', 'INVENTORY'),
('INVENTORY_DELETE', 'Delete Inventory', 'Remove inventory items', 'INVENTORY'),
('INVENTORY_EXPORT', 'Export Inventory', 'Export inventory data and reports', 'INVENTORY'),
('INVENTORY_BULK_UPLOAD', 'Bulk Upload', 'Upload inventory data via CSV', 'INVENTORY'),
('INVENTORY_TRANSFER', 'Transfer Stock', 'Transfer inventory between warehouses', 'INVENTORY'),
('INVENTORY_ADJUST', 'Stock Adjustment', 'Make inventory adjustments and corrections', 'INVENTORY'),
('INVENTORY_TIMELINE', 'View Timeline', 'View inventory movement timeline and history', 'INVENTORY'),
('INVENTORY_WAREHOUSE_ACCESS', 'Warehouse Access', 'Access to warehouse-specific inventory', 'INVENTORY'),
('INVENTORY_CROSS_WAREHOUSE', 'Cross Warehouse', 'Access inventory across all warehouses', 'INVENTORY'),
('INVENTORY_REPORTS', 'Inventory Reports', 'Generate and view inventory reports', 'INVENTORY'),

-- PRODUCTS PERMISSIONS (10)
('PRODUCTS_VIEW', 'View Products', 'View product catalog and details', 'PRODUCTS'),
('PRODUCTS_CREATE', 'Add Products', 'Add new products to catalog', 'PRODUCTS'),
('PRODUCTS_EDIT', 'Edit Products', 'Modify existing product information', 'PRODUCTS'),
('PRODUCTS_DELETE', 'Delete Products', 'Remove products from catalog', 'PRODUCTS'),
('PRODUCTS_EXPORT', 'Export Products', 'Export product data and catalogs', 'PRODUCTS'),
('PRODUCTS_BULK_IMPORT', 'Bulk Import', 'Import products via CSV with progress tracking', 'PRODUCTS'),
('PRODUCTS_CATEGORIES', 'Manage Categories', 'Manage product categories and classifications', 'PRODUCTS'),
('PRODUCTS_PRICING', 'Manage Pricing', 'Update product prices and cost information', 'PRODUCTS'),
('PRODUCTS_TRANSFER', 'Transfer Products', 'Transfer products between locations', 'PRODUCTS'),
('PRODUCTS_REPORTS', 'Product Reports', 'Generate and view product reports', 'PRODUCTS'),

-- ORDERS PERMISSIONS (12)
('ORDERS_VIEW', 'View Orders', 'View order list and details', 'ORDERS'),
('ORDERS_CREATE', 'Create Orders', 'Create new orders and dispatches', 'ORDERS'),
('ORDERS_EDIT', 'Edit Orders', 'Modify existing orders and details', 'ORDERS'),
('ORDERS_DELETE', 'Delete Orders', 'Cancel or delete orders with stock restoration', 'ORDERS'),
('ORDERS_EXPORT', 'Export Orders', 'Export order data and reports', 'ORDERS'),
('ORDERS_STATUS_UPDATE', 'Update Status', 'Change order status and tracking', 'ORDERS'),
('ORDERS_DISPATCH', 'Dispatch Orders', 'Create and manage dispatch operations', 'ORDERS'),
('ORDERS_TIMELINE', 'Order Timeline', 'View order tracking timeline and history', 'ORDERS'),
('ORDERS_REMARKS', 'Edit Remarks', 'Add and edit order remarks and notes', 'ORDERS'),
('ORDERS_FINANCIAL', 'Financial Data', 'View order amounts and financial information', 'ORDERS'),
('ORDERS_WAREHOUSE_FILTER', 'Warehouse Filter', 'Filter orders by warehouse locations', 'ORDERS'),
('ORDERS_REPORTS', 'Order Reports', 'Generate and view order reports', 'ORDERS'),

-- TRACKING PERMISSIONS (6)
('TRACKING_VIEW', 'View Tracking', 'View shipment tracking information', 'TRACKING'),
('TRACKING_UPDATE', 'Update Tracking', 'Update tracking status and information', 'TRACKING'),
('TRACKING_CREATE', 'Create Tracking', 'Create new tracking entries', 'TRACKING'),
('TRACKING_EXPORT', 'Export Tracking', 'Export tracking data and reports', 'TRACKING'),
('TRACKING_TIMELINE', 'Tracking Timeline', 'View detailed tracking timeline', 'TRACKING'),
('TRACKING_REPORTS', 'Tracking Reports', 'Generate tracking and delivery reports', 'TRACKING'),

-- OPERATIONS PERMISSIONS (8)
('OPERATIONS_DAMAGE_RECORD', 'Record Damage', 'Record damaged inventory items', 'OPERATIONS'),
('OPERATIONS_DAMAGE_APPROVE', 'Approve Damage', 'Approve damage transactions', 'OPERATIONS'),
('OPERATIONS_RETURN_PROCESS', 'Process Returns', 'Handle product returns and refunds', 'OPERATIONS'),
('OPERATIONS_RETURN_APPROVE', 'Approve Returns', 'Approve return transactions', 'OPERATIONS'),
('OPERATIONS_RECOVERY', 'Recovery Operations', 'Process damage recovery operations', 'OPERATIONS'),
('OPERATIONS_BULK_UPLOAD', 'Bulk Operations', 'Perform bulk upload operations', 'OPERATIONS'),
('OPERATIONS_TRANSFER', 'Transfer Operations', 'Handle inter-warehouse transfers', 'OPERATIONS'),
('OPERATIONS_REPORTS', 'Operations Reports', 'Generate operational reports and analytics', 'OPERATIONS'),

-- SYSTEM PERMISSIONS (8)
('SYSTEM_USER_MANAGEMENT', 'User Management', 'Manage system users and accounts', 'SYSTEM'),
('SYSTEM_ROLE_MANAGEMENT', 'Role Management', 'Manage user roles and permissions', 'SYSTEM'),
('SYSTEM_PERMISSION_MANAGEMENT', 'Permission Management', 'Manage system permissions', 'SYSTEM'),
('SYSTEM_AUDIT_LOG', 'Audit Log', 'View system audit logs and user activities', 'SYSTEM'),
('SYSTEM_SETTINGS', 'System Settings', 'Configure system settings and preferences', 'SYSTEM'),
('SYSTEM_BACKUP', 'System Backup', 'Perform system backups and maintenance', 'SYSTEM'),
('SYSTEM_MONITORING', 'System Monitoring', 'Monitor system performance and health', 'SYSTEM'),
('SYSTEM_REPORTS', 'System Reports', 'Generate system-wide reports and analytics', 'SYSTEM');

-- =====================================================
-- ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- SUPER ADMIN: ALL PERMISSIONS (61 permissions)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'super_admin';

-- ADMIN: MOST PERMISSIONS (EXCLUDE CRITICAL SYSTEM FUNCTIONS)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'admin' 
AND p.name NOT IN ('SYSTEM_BACKUP', 'SYSTEM_USER_MANAGEMENT');

-- MANAGER: OPERATIONAL PERMISSIONS (NO DELETE, LIMITED SYSTEM)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'manager' 
AND p.category IN ('DASHBOARD', 'INVENTORY', 'PRODUCTS', 'ORDERS', 'TRACKING', 'OPERATIONS')
AND p.name NOT LIKE '%DELETE%'
AND p.name NOT LIKE '%BULK%'
AND p.name NOT LIKE '%APPROVE%';

-- OPERATOR: EXECUTION PERMISSIONS (NO DELETE, NO ADMIN)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'operator' 
AND p.category IN ('DASHBOARD', 'INVENTORY', 'PRODUCTS', 'ORDERS', 'TRACKING', 'OPERATIONS')
AND p.name NOT LIKE '%DELETE%'
AND p.name NOT LIKE '%MANAGE%'
AND p.name NOT LIKE '%APPROVE%'
AND p.name NOT LIKE '%CROSS_WAREHOUSE%';

-- WAREHOUSE STAFF: WAREHOUSE-SPECIFIC PERMISSIONS
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'warehouse_staff' 
AND (p.category IN ('INVENTORY', 'OPERATIONS') 
     OR p.name IN ('DASHBOARD_VIEW', 'ORDERS_VIEW', 'ORDERS_STATUS_UPDATE', 'TRACKING_VIEW', 'TRACKING_UPDATE'))
AND p.name NOT LIKE '%DELETE%'
AND p.name NOT LIKE '%CROSS_WAREHOUSE%'
AND p.name NOT LIKE '%APPROVE%';

-- VIEWER: READ-ONLY PERMISSIONS
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'viewer' 
AND p.name LIKE '%VIEW%';

-- =====================================================
-- UPDATE USERS TABLE (ADD ROLE SUPPORT)
-- =====================================================

-- Add role_id column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') DEFAULT 'active';

-- Add foreign key constraint (ignore if exists)
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
               WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'role_id' 
               AND CONSTRAINT_NAME LIKE '%fk%') = 0,
              'ALTER TABLE users ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id)',
              'SELECT "Foreign key already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- CREATE TEST USER
-- =====================================================

-- Create/Update test user with super_admin role
INSERT INTO users (name, email, password, role_id, status) 
SELECT 'Test Admin', 'admin@example.com', 'password123', r.id, 'active'
FROM roles r 
WHERE r.name = 'super_admin'
ON DUPLICATE KEY UPDATE 
    password = 'password123',
    role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1),
    status = 'active',
    name = 'Test Admin';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show setup summary
SELECT 'PERMISSIONS SYSTEM SETUP COMPLETE' as status;

SELECT 
    'ROLES' as type,
    COUNT(*) as count,
    GROUP_CONCAT(display_name ORDER BY name) as items
FROM roles 
WHERE is_active = true;

SELECT 
    'PERMISSIONS' as type,
    COUNT(*) as count,
    CONCAT(
        SUM(CASE WHEN category = 'DASHBOARD' THEN 1 ELSE 0 END), ' Dashboard, ',
        SUM(CASE WHEN category = 'INVENTORY' THEN 1 ELSE 0 END), ' Inventory, ',
        SUM(CASE WHEN category = 'PRODUCTS' THEN 1 ELSE 0 END), ' Products, ',
        SUM(CASE WHEN category = 'ORDERS' THEN 1 ELSE 0 END), ' Orders, ',
        SUM(CASE WHEN category = 'TRACKING' THEN 1 ELSE 0 END), ' Tracking, ',
        SUM(CASE WHEN category = 'OPERATIONS' THEN 1 ELSE 0 END), ' Operations, ',
        SUM(CASE WHEN category = 'SYSTEM' THEN 1 ELSE 0 END), ' System'
    ) as breakdown
FROM permissions 
WHERE is_active = true;

SELECT 
    'ROLE ASSIGNMENTS' as type,
    COUNT(*) as total_assignments,
    'Permissions assigned to roles' as description
FROM role_permissions;

-- Show test user
SELECT 
    u.name, 
    u.email, 
    r.display_name as role, 
    u.status,
    'Test credentials: admin@example.com / password123' as note
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.email = 'admin@example.com';

-- =====================================================
-- SETUP COMPLETE
-- =====================================================