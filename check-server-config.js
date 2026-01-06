// Check server configuration
// Run with: node check-server-config.js

const fs = require('fs');
const path = require('path');

function checkServerConfig() {
    console.log('🔍 Checking Server Configuration...\n');
    
    try {
        // Check 1: Does server.js exist?
        console.log('1. Checking server.js...');
        if (fs.existsSync('server.js')) {
            console.log('✅ server.js exists');
            
            const serverContent = fs.readFileSync('server.js', 'utf8');
            
            // Check if permissions routes are included
            if (serverContent.includes('permissionsRoutes')) {
                console.log('✅ Permissions routes are configured in server.js');
            } else {
                console.log('❌ Permissions routes NOT configured in server.js');
                console.log('Add this line to server.js:');
                console.log("app.use('/api', require('./routes/permissionsRoutes'));");
            }
        } else {
            console.log('❌ server.js not found');
        }
        
        // Check 2: Do the route files exist?
        console.log('\n2. Checking route files...');
        
        const requiredFiles = [
            'routes/permissionsRoutes.js',
            'controllers/permissionsController.js',
            'middleware/auth.js'
        ];
        
        requiredFiles.forEach(file => {
            if (fs.existsSync(file)) {
                console.log(`✅ ${file} exists`);
            } else {
                console.log(`❌ ${file} missing`);
            }
        });
        
        // Check 3: Are required packages installed?
        console.log('\n3. Checking package.json...');
        
        if (fs.existsSync('package.json')) {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            const requiredPackages = ['bcrypt', 'jsonwebtoken'];
            
            requiredPackages.forEach(pkg => {
                if (dependencies[pkg]) {
                    console.log(`✅ ${pkg} is installed`);
                } else {
                    console.log(`❌ ${pkg} is NOT installed`);
                    console.log(`Run: npm install ${pkg}`);
                }
            });
        }
        
        // Check 4: Check for syntax errors in route files
        console.log('\n4. Checking for syntax errors...');
        
        try {
            if (fs.existsSync('routes/permissionsRoutes.js')) {
                require('./routes/permissionsRoutes.js');
                console.log('✅ permissionsRoutes.js has no syntax errors');
            }
        } catch (error) {
            console.log('❌ Syntax error in permissionsRoutes.js:', error.message);
        }
        
        try {
            if (fs.existsSync('controllers/permissionsController.js')) {
                require('./controllers/permissionsController.js');
                console.log('✅ permissionsController.js has no syntax errors');
            }
        } catch (error) {
            console.log('❌ Syntax error in permissionsController.js:', error.message);
        }
        
        // Check 5: Environment variables
        console.log('\n5. Checking environment variables...');
        
        if (process.env.JWT_SECRET) {
            console.log('✅ JWT_SECRET is set');
        } else {
            console.log('⚠️  JWT_SECRET not set (will use default)');
        }
        
        console.log('\n📋 Summary:');
        console.log('If everything shows ✅, your configuration should be correct.');
        console.log('If you see ❌, fix those issues first.');
        
    } catch (error) {
        console.error('❌ Configuration check failed:', error.message);
    }
}

// Run check
checkServerConfig();