#!/usr/bin/env node

// Quick fix for permissions controller database destructuring issue
// Run with: node fix-permissions-controller.js

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing PermissionsController database destructuring...\n');

const controllerPath = path.join(__dirname, 'controllers', 'permissionsController.js');

try {
    // Read the current file
    let content = fs.readFileSync(controllerPath, 'utf8');
    
    console.log('📖 Reading current controller file...');
    
    // Fix the login method - replace the problematic lines
    const oldLoginCode = `            // Get user with role information
            const result = await db.execute(\`
                SELECT u.*, r.name as role_name, r.display_name as role_display_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.email = ?
            \`, [email]);
            
            const users = Array.isArray(result) ? result[0] : result;`;
            
    const newLoginCode = `            // Get user with role information
            const [users] = await db.execute(\`
                SELECT u.*, r.name as role_name, r.display_name as role_display_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.email = ?
            \`, [email]);`;
    
    // Replace the problematic code
    content = content.replace(oldLoginCode, newLoginCode);
    
    // Also fix the permissions query in login
    const oldPermCode = `            // Get user permissions
            const permResult = await db.execute(\`
                SELECT p.name, p.display_name, p.category
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ? AND p.is_active = true
            \`, [user.role_id]);
            
            const permissions = Array.isArray(permResult) ? permResult[0] : permResult;`;
            
    const newPermCode = `            // Get user permissions
            const [permissions] = await db.execute(\`
                SELECT p.name, p.display_name, p.category
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ? AND p.is_active = true
            \`, [user.role_id]);`;
    
    content = content.replace(oldPermCode, newPermCode);
    
    // Write the fixed file
    fs.writeFileSync(controllerPath, content);
    
    console.log('✅ Fixed database destructuring in login method');
    console.log('✅ Fixed permissions query destructuring');
    console.log('\n🎉 PermissionsController fixed successfully!');
    console.log('\nNow test with: node test-backend-auth.js');
    
} catch (error) {
    console.error('❌ Error fixing controller:', error.message);
    process.exit(1);
}