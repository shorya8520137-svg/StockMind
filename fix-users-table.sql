-- =====================================================
-- FIX EXISTING USERS TABLE FOR PERMISSIONS SYSTEM
-- =====================================================

-- Check if users table exists and show its structure
DESCRIBE users;

-- Add missing columns to existing users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') DEFAULT 'active' AFTER role_id,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL AFTER status,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER last_login,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Add indexes if they don't exist
ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_email (email),
ADD INDEX IF NOT EXISTS idx_role (role_id),
ADD INDEX IF NOT EXISTS idx_status (status);

-- Update existing users to have active status
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Show the updated table structure
DESCRIBE users;

-- Show current users
SELECT id, name, email, role_id, status FROM users;