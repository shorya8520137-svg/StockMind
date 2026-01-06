-- =====================================================
-- PERMISSIONS TABLE SETUP
-- Complete list of permissions from frontend system
-- =====================================================

-- Create permissions table if it doesn't exist
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

-- Create roles table if it doesn't exist
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

-- Create role_permissions junction table if it doesn't exist
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

-- Insert all roles
INSERT IGNORE INTO roles (name, display_name, description, color) VALUES
('SUPER_ADMIN', 'Super Admin', 'Full system access with all permissions', '#ef4444'),
('ADMIN', 'Admin', 'Administrative access with most permissions', '#f97316'),
('MANAGER', 'Manager', 'Management operations and oversight', '#eab308'),
('OPERATOR', 'Operator', 'Operational tasks and daily operations', '#22c55e'),
('WAREHOUSE_STAFF', 'Warehouse Staff', 'Warehouse operations and inventory', '#3b82f6'),
('VIEWER', 'Viewer', 'Read-only access to view data', '#6366f1');

-- Insert all permissions
INSERT IGNORE INTO permissions (name, display_name, description, category) VALUES

-- DASHBOARD PERMISSIONS
('DASHBOARD_VIEW', 'View Dashboard', 'Access to main dashboard', 'DASHBOARD'),
('DASHBOARD_STATS', 'View Statistics', 'View dashboard statistics and metrics', 'DASHBOARD'),
('DASHBOARD_CHARTS', 'View Charts', 'Access to dashboard charts and graphs', 'DASHBOARD'),
('DASHBOARD_EXPORT', 'Export Dashboard', 'Export dashboard data and reports', 'DASHBOARD'),
('DASHBOARD_CUSTOMIZE', 'Customize Dashboard', 'Customize dashboard layout and widgets', 'DASHBOARD'),

-- INVENTORY PERMISSIONS
('INVENTORY_VIEW', 'View Inventory', 'View inventory items and stock levels', 'INVENTORY'),
('INVENTORY_CREATE', 'Create Inventory', 'Add new inventory items', 'INVENTORY'),
('INVENTORY_EDIT', 'Edit Inventory', 'Modify existing inventory items', 'INVENTORY'),
('INVENTORY_DELETE', 'Delete Inventory', 'Remove inventory items', 'INVENTORY'),
('INVENTORY_BULK_UPLOAD', 'Bulk Upload Inventory', 'Upload inventory in bulk via CSV', 'INVENTORY'),
('INVENTORY_BULK_EXPORT', 'Bulk Export Inventory', 'Export inventory data in bulk', 'INVENTORY'),
('INVENTORY_TRANSFER', 'Transfer Inventory', 'Transfer inventory between warehouses', 'INVENTORY'),
('INVENTORY_ADJUST', 'Adjust Inventory', 'Make inventory adjustments and corrections', 'INVENTORY'),
('INVENTORY_AUDIT', 'Audit Inventory', 'Perform inventory audits and reconciliation', 'INVENTORY'),
('INVENTORY_TIMELINE', 'View Timeline', 'View inventory movement timeline', 'INVENTORY'),
('INVENTORY_REPORTS', 'Inventory Reports', 'Generate and view inventory reports', 'INVENTORY'),

-- ORDER PERMISSIONS
('ORDERS_VIEW', 'View Orders', 'View order list and details', 'ORDERS'),
('ORDERS_CREATE', 'Create Orders', 'Create new orders', 'ORDERS'),
('ORDERS_EDIT', 'Edit Orders', 'Modify existing orders', 'ORDERS'),
('ORDERS_DELETE', 'Delete Orders', 'Cancel or delete orders', 'ORDERS'),
('ORDERS_PROCESS', 'Process Orders', 'Process and fulfill orders', 'ORDERS'),
('ORDERS_DISPATCH', 'Dispatch Orders', 'Dispatch orders for delivery', 'ORDERS'),
('ORDERS_RETURNS', 'Handle Returns', 'Process order returns and refunds', 'ORDERS'),
('ORDERS_BULK_PROCESS', 'Bulk Process Orders', 'Process multiple orders at once', 'ORDERS'),
('ORDERS_EXPORT', 'Export Orders', 'Export order data and reports', 'ORDERS'),
('ORDERS_REPORTS', 'Order Reports', 'Generate and view order reports', 'ORDERS'),

-- TRACKING PERMISSIONS
('TRACKING_VIEW', 'View Tracking', 'View shipment tracking information', 'TRACKING'),
('TRACKING_UPDATE', 'Update Tracking', 'Update tracking status and information', 'TRACKING'),
('TRACKING_CREATE', 'Create Tracking', 'Create new tracking entries', 'TRACKING'),
('TRACKING_BULK_UPDATE', 'Bulk Update Tracking', 'Update multiple tracking entries', 'TRACKING'),
('TRACKING_REPORTS', 'Tracking Reports', 'Generate tracking and delivery reports', 'TRACKING'),
('TRACKING_NOTIFICATIONS', 'Tracking Notifications', 'Send tracking notifications to customers', 'TRACKING'),

-- MESSAGES PERMISSIONS
('MESSAGES_VIEW', 'View Messages', 'View team messages and communications', 'MESSAGES'),
('MESSAGES_SEND', 'Send Messages', 'Send messages to team members', 'MESSAGES'),
('MESSAGES_DELETE', 'Delete Messages', 'Delete messages and conversations', 'MESSAGES'),
('MESSAGES_MODERATE', 'Moderate Messages', 'Moderate team communications', 'MESSAGES'),
('MESSAGES_EXPORT', 'Export Messages', 'Export message history and logs', 'MESSAGES'),

-- PRODUCTS PERMISSIONS
('PRODUCTS_VIEW', 'View Products', 'View product catalog and details', 'PRODUCTS'),
('PRODUCTS_CREATE', 'Create Products', 'Add new products to catalog', 'PRODUCTS'),
('PRODUCTS_EDIT', 'Edit Products', 'Modify existing product information', 'PRODUCTS'),
('PRODUCTS_DELETE', 'Delete Products', 'Remove products from catalog', 'PRODUCTS'),
('PRODUCTS_BULK_IMPORT', 'Bulk Import Products', 'Import products in bulk via CSV', 'PRODUCTS'),
('PRODUCTS_BULK_EXPORT', 'Bulk Export Products', 'Export product data in bulk', 'PRODUCTS'),
('PRODUCTS_CATEGORIES', 'Manage Categories', 'Manage product categories and classifications', 'PRODUCTS'),
('PRODUCTS_PRICING', 'Manage Pricing', 'Update product prices and cost information', 'PRODUCTS'),
('PRODUCTS_REPORTS', 'Product Reports', 'Generate and view product reports', 'PRODUCTS'),

-- OPERATIONS PERMISSIONS
('OPERATIONS_DAMAGE_RECORD', 'Record Damage', 'Record damaged inventory items', 'OPERATIONS'),
('OPERATIONS_DAMAGE_RECOVER', 'Recover Damage', 'Process damage recovery operations', 'OPERATIONS'),
('OPERATIONS_WAREHOUSE_MANAGE', 'Manage Warehouses', 'Manage warehouse information and settings', 'OPERATIONS'),
('OPERATIONS_STAFF_MANAGE', 'Manage Staff', 'Manage warehouse staff and assignments', 'OPERATIONS'),
('OPERATIONS_QUALITY_CONTROL', 'Quality Control', 'Perform quality control checks', 'OPERATIONS'),
('OPERATIONS_REPORTS', 'Operations Reports', 'Generate operational reports and analytics', 'OPERATIONS'),

-- SYSTEM PERMISSIONS
('SYSTEM_USER_MANAGEMENT', 'User Management', 'Manage system users and accounts', 'SYSTEM'),
('SYSTEM_ROLE_MANAGEMENT', 'Role Management', 'Manage user roles and permissions', 'SYSTEM'),
('SYSTEM_PERMISSION_MANAGEMENT', 'Permission Management', 'Manage system permissions', 'SYSTEM'),
('SYSTEM_SETTINGS', 'System Settings', 'Configure system settings and preferences', 'SYSTEM'),
('SYSTEM_BACKUP', 'System Backup', 'Perform system backups and data export', 'SYSTEM'),
('SYSTEM_RESTORE', 'System Restore', 'Restore system from backups', 'SYSTEM'),
('SYSTEM_AUDIT_LOG', 'Audit Log', 'View system audit logs and user activities', 'SYSTEM'),
('SYSTEM_MAINTENANCE', 'System Maintenance', 'Perform system maintenance tasks', 'SYSTEM'),
('SYSTEM_MONITORING', 'System Monitoring', 'Monitor system performance and health', 'SYSTEM'),
('SYSTEM_INTEGRATION', 'System Integration', 'Manage external system integrations', 'SYSTEM');

-- Assign permissions to roles
-- SUPER_ADMIN gets all permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'SUPER_ADMIN';

-- ADMIN gets most permissions (exclude some system-critical ones)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'ADMIN' 
AND p.name NOT IN ('SYSTEM_BACKUP', 'SYSTEM_RESTORE', 'SYSTEM_MAINTENANCE');

-- MANAGER gets management and operational permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'MANAGER' 
AND p.category IN ('DASHBOARD', 'INVENTORY', 'ORDERS', 'TRACKING', 'PRODUCTS', 'OPERATIONS')
AND p.name NOT LIKE '%DELETE%'
AND p.name NOT LIKE '%BULK%';

-- OPERATOR gets operational permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'OPERATOR' 
AND p.category IN ('INVENTORY', 'ORDERS', 'TRACKING', 'OPERATIONS')
AND p.name NOT LIKE '%DELETE%'
AND p.name NOT LIKE '%MANAGE%';

-- WAREHOUSE_STAFF gets warehouse-specific permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'WAREHOUSE_STAFF' 
AND (p.category IN ('INVENTORY', 'OPERATIONS') 
     OR p.name IN ('ORDERS_VIEW', 'ORDERS_PROCESS', 'TRACKING_VIEW', 'TRACKING_UPDATE'));

-- VIEWER gets read-only permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'VIEWER' 
AND p.name LIKE '%VIEW%';

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id),
    INDEX idx_email (email),
    INDEX idx_role (role_id),
    INDEX idx_status (status)
);

-- Create audit_logs table for tracking user activities
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
-- SUMMARY
-- =====================================================
-- Total Permissions: 50+
-- Categories: 8 (Dashboard, Inventory, Orders, Tracking, Messages, Products, Operations, System)
-- Roles: 6 (Super Admin, Admin, Manager, Operator, Warehouse Staff, Viewer)
-- 
-- This setup provides:
-- 1. Granular permission control
-- 2. Role-based access control (RBAC)
-- 3. Audit logging capabilities
-- 4. Scalable permission system
-- 5. Frontend-backend permission synchronization