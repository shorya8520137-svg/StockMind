-- Check existing database structure and data
-- Run with: mysql -u root -p hunyhuny_auto_dispatch < check-existing-db.sql

SELECT '=== USERS TABLE STRUCTURE ===' as info;
DESCRIBE users;

SELECT '=== EXISTING USERS ===' as info;
SELECT id, name, email, role_id, 
       CASE WHEN password_hash IS NOT NULL THEN 'Has password hash' 
            WHEN password IS NOT NULL THEN 'Has password (old format)' 
            ELSE 'No password' END as password_status
FROM users LIMIT 5;

SELECT '=== ROLES DATA ===' as info;
SELECT * FROM roles;

SELECT '=== PERMISSIONS COUNT ===' as info;
SELECT COUNT(*) as total_permissions FROM permissions;

SELECT '=== SAMPLE PERMISSIONS ===' as info;
SELECT name, category FROM permissions LIMIT 10;

SELECT '=== ROLE PERMISSIONS COUNT ===' as info;
SELECT r.name as role_name, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name;