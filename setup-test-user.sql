-- Setup test user for your existing database
-- Run with: mysql -u root -p hunyhuny_auto_dispatch < setup-test-user.sql

-- First, let's see what we have
SELECT 'Current admin user:' as info;
SELECT id, name, email, role_id, role FROM users WHERE email = 'admin@example.com';

-- Update the admin user to be super_admin and set a known password
UPDATE users 
SET role_id = 1, 
    password = 'password123',
    name = 'Test Admin'
WHERE email = 'admin@example.com';

-- Verify the update
SELECT 'Updated admin user:' as info;
SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, r.display_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'admin@example.com';

-- Show role permissions count
SELECT 'Role permissions:' as info;
SELECT r.name as role_name, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name = 'super_admin'
GROUP BY r.id, r.name;