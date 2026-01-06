#!/bin/bash

# Permissions System Deployment Script
# Run with: bash deploy-permissions.sh

echo "🚀 Deploying Permissions System..."
echo "=================================="

# Step 1: Install required packages
echo "📦 Installing required packages..."
npm install bcrypt jsonwebtoken
if [ $? -eq 0 ]; then
    echo "✅ Packages installed successfully"
else
    echo "❌ Failed to install packages"
    exit 1
fi

# Step 2: Create middleware directory
echo "📁 Creating middleware directory..."
mkdir -p middleware
echo "✅ Middleware directory created"

# Step 3: Check if database setup is needed
echo "🗄️  Checking database setup..."
mysql -u root -p -e "USE inventory_system; SHOW TABLES LIKE 'permissions';" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Permissions table exists"
else
    echo "⚠️  Permissions table not found. Please run:"
    echo "   mysql -u root -p inventory_system < permissions-database-setup.sql"
fi

# Step 4: Check server configuration
echo "🔧 Checking server configuration..."
if grep -q "permissionsRoutes" server.js; then
    echo "✅ Permissions routes already configured in server.js"
else
    echo "⚠️  Please add this line to server.js:"
    echo "   app.use('/api', require('./routes/permissionsRoutes'));"
fi

# Step 5: Set up environment variables
echo "🔐 Checking environment variables..."
if grep -q "JWT_SECRET" .env 2>/dev/null || grep -q "JWT_SECRET" .env.local 2>/dev/null; then
    echo "✅ JWT_SECRET found in environment"
else
    echo "⚠️  Please add JWT_SECRET to your .env file:"
    echo "   JWT_SECRET=your-super-secret-jwt-key-here"
fi

# Step 6: Run setup script
echo "🔧 Running permissions setup..."
node setup-permissions.js

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📝 Next steps:"
echo "1. Make sure your server is running: npm start"
echo "2. Test the system: node test-permissions.js"
echo "3. Login with: admin@test.com / password123"
echo ""
echo "🔗 API Endpoints available:"
echo "   POST /api/auth/login"
echo "   GET  /api/users"
echo "   GET  /api/roles"
echo "   GET  /api/permissions"
echo ""