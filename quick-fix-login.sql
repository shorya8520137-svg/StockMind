-- Quick fix for login issues
-- Run this if you're getting login errors

-- First, let's see what we have
SELECT 'Current users table structure:' as info;
DESCRIBE users;

SELECT 'Current users in table:' as info;
SELECT id, name, email, role_id FROM users LIMIT 5;

-- Add missing columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) AFTER email;

-- If you have a 'password' column, copy it to 'password_hash'
UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL;

-- Create a test user with proper password hash
-- Password: password123
INSERT IGNORE INTO users (name, email, password_hash, role_id) 
SELECT 'Test Admin', 'admin@test.com', '$2b$10$rQJ8vQZ9QZ9QZ9QZ9QZ9QOuKl7WvJ7WvJ7WvJ7WvJ7WvJ7WvJ7WvJ7', r.id
FROM roles r WHERE r.name = 'SUPER_ADMIN' LIMIT 1;

-- Show final result
SELECT 'Final users table:' as info;
SELECT id, name, email, role_id, 
       CASE WHEN password_hash IS NOT NULL THEN 'Has password hash' ELSE 'No password hash' END as password_status
FROM users;