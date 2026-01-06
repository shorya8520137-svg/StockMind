-- Simple database check
-- Run with: mysql -u root -p inventory_system < simple-db-check.sql

SELECT 'Checking database tables...' as status;

SHOW TABLES;

SELECT 'Checking users table structure...' as status;

DESCRIBE users;

SELECT 'Checking existing users...' as status;

SELECT id, name, email, role_id, 
       CASE WHEN password_hash IS NOT NULL THEN 'Has password hash' ELSE 'No password hash' END as password_status
FROM users LIMIT 5;

SELECT 'Checking roles...' as status;

SELECT * FROM roles;

SELECT 'Checking permissions count...' as status;

SELECT COUNT(*) as permission_count FROM permissions;