USE hunyhuny_auto_dispatch;

-- Add status column (ignore error if exists)
ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active';

-- Verify the user is now super_admin
SELECT u.name, u.email, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = 'admin@example.com';