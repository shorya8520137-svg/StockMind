-- Fix users table and create test user
USE hunyhuny_auto_dispatch;

-- Add status column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') DEFAULT 'active';

-- Create/Update test user (without status first, then update)
INSERT INTO users (name, email, password, role_id) 
SELECT 'Test Admin', 'admin@example.com', 'password123', r.id
FROM roles r 
WHERE r.name = 'super_admin'
ON DUPLICATE KEY UPDATE 
    password = 'password123',
    role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1),
    name = 'Test Admin';

-- Update status separately
UPDATE users SET status = 'active' WHERE email = 'admin@example.com';

-- Verify test user
SELECT u.name, u.email, r.name as role, u.status FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = 'admin@example.com';