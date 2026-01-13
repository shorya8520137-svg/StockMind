#!/bin/bash

# StockMind Complete Deployment Script
# Deploys both frontend and backend with single start command

echo "🚀 Starting StockMind deployment to EC2 server..."

# Server configuration
SERVER_IP="3.110.194.171"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/ec2-python-ssh.pem"
PROJECT_DIR="stockmind"

echo "📡 Connecting to server: $SERVER_USER@$SERVER_IP"

# Step 1: Prepare server environment
echo "🔧 Setting up server environment..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
    echo "🔧 Installing required packages..."
    
    # Update system
    sudo apt-get update
    
    # Install Node.js 18.x if not installed
    if ! command -v node &> /dev/null; then
        echo "📦 Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "✅ Node.js already installed: $(node --version)"
    fi
    
    # Install Git if not installed
    if ! command -v git &> /dev/null; then
        echo "📦 Installing Git..."
        sudo apt-get install -y git
    else
        echo "✅ Git already installed: $(git --version)"
    fi
    
    # Install PM2 globally
    if ! command -v pm2 &> /dev/null; then
        echo "📦 Installing PM2..."
        sudo npm install -g pm2
    else
        echo "✅ PM2 already installed: $(pm2 --version)"
    fi
    
    # Install Nginx if not installed
    if ! command -v nginx &> /dev/null; then
        echo "📦 Installing Nginx..."
        sudo apt-get install -y nginx
    else
        echo "✅ Nginx already installed"
    fi
EOF

# Step 2: Clone/Update repository
echo "📥 Deploying StockMind code..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
    cd /home/ubuntu
    
    # Stop existing services
    pm2 delete all 2>/dev/null || true
    
    # Remove existing directory if it exists
    if [ -d "stockmind" ]; then
        echo "🗑️ Removing existing stockmind directory..."
        rm -rf stockmind
    fi
    
    # Clone the repository
    echo "📥 Cloning StockMind repository..."
    git clone https://github.com/shorya8520137-svg/StockMind.git stockmind
    
    # Navigate to project directory
    cd stockmind
    
    echo "📋 Project cloned successfully:"
    ls -la
EOF

# Step 3: Install dependencies and build
echo "📦 Installing dependencies and building application..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
    cd /home/ubuntu/stockmind
    
    # Install all dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Create production environment file
    echo "🔧 Setting up environment variables..."
    cat > .env.production << 'ENVEOF'
# Production Environment Variables
NODE_ENV=production
PORT=5000

# API Configuration
NEXT_PUBLIC_API_BASE=https://api.hunyhuny.org/api
NEXT_PUBLIC_API_TIMEOUT=30000

# Database Configuration
DB_HOST=inventory-db.cv2iey8a8hbk.ap-south-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=gfx998sd
DB_NAME=hunyhuny_auto_dispatch
DB_PORT=3306
ENVEOF

    # Build Next.js application
    echo "🏗️ Building Next.js application..."
    npm run build
    
    echo "✅ Build completed successfully"
EOF

# Step 4: Create PM2 configuration and startup scripts
echo "🚀 Setting up PM2 and startup scripts..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
    cd /home/ubuntu/stockmind
    
    # Create logs directory
    mkdir -p logs
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [
    {
      name: 'stockmind-backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'stockmind-frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
PMEOF

    # Create single startup script
    cat > start-stockmind.sh << 'STARTEOF'
#!/bin/bash
echo "🚀 Starting StockMind Application..."

cd /home/ubuntu/stockmind

# Stop any existing processes
pm2 delete all 2>/dev/null || true

# Start both frontend and backend
echo "📦 Starting backend server..."
pm2 start ecosystem.config.js --only stockmind-backend

echo "🌐 Starting frontend server..."
pm2 start ecosystem.config.js --only stockmind-frontend

# Save PM2 configuration
pm2 save

echo "✅ StockMind started successfully!"
echo "📊 Process status:"
pm2 status

echo ""
echo "🔗 Application URLs:"
echo "   Frontend: http://13.201.222.24:3000"
echo "   Backend API: http://13.201.222.24:5000/api"
echo ""
echo "📝 To check logs: pm2 logs"
echo "📝 To stop: pm2 delete all"
STARTEOF

    # Create stop script
    cat > stop-stockmind.sh << 'STOPEOF'
#!/bin/bash
echo "🛑 Stopping StockMind Application..."

cd /home/ubuntu/stockmind

# Stop all PM2 processes
pm2 delete all

echo "✅ StockMind stopped successfully!"
STOPEOF

    # Create restart script
    cat > restart-stockmind.sh << 'RESTARTEOF'
#!/bin/bash
echo "🔄 Restarting StockMind Application..."

cd /home/ubuntu/stockmind

# Restart all processes
pm2 restart all

echo "✅ StockMind restarted successfully!"
pm2 status
RESTARTEOF

    # Make scripts executable
    chmod +x start-stockmind.sh
    chmod +x stop-stockmind.sh
    chmod +x restart-stockmind.sh
    
    echo "✅ Startup scripts created successfully"
EOF

# Step 5: Setup Nginx reverse proxy
echo "🌐 Setting up Nginx reverse proxy..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
    # Create Nginx configuration for StockMind
    sudo tee /etc/nginx/sites-available/stockmind << 'NGINXEOF'
server {
    listen 80;
    server_name 13.201.222.24 api.hunyhuny.org hunyhuny.org;

    # Frontend (Next.js) - Default route
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
NGINXEOF

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/stockmind /etc/nginx/sites-enabled/
    
    # Remove default site if it exists
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Restart Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    echo "✅ Nginx configured and restarted"
EOF

# Step 6: Start the application
echo "🚀 Starting StockMind application..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
    cd /home/ubuntu/stockmind
    
    # Run the startup script
    ./start-stockmind.sh
    
    # Setup PM2 to start on boot
    pm2 startup
    pm2 save
EOF

# Final status check
echo "🔍 Final deployment status check..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
    echo "📊 Deployment Status Report"
    echo "=========================="
    
    echo ""
    echo "🔧 PM2 Processes:"
    pm2 status
    
    echo ""
    echo "🌐 Nginx Status:"
    sudo systemctl status nginx --no-pager -l | head -10
    
    echo ""
    echo "📁 Project Files:"
    ls -la /home/ubuntu/stockmind/ | head -10
    
    echo ""
    echo "🔗 Application Access URLs:"
    echo "   Main Application: http://13.201.222.24"
    echo "   Frontend Direct: http://13.201.222.24:3000"
    echo "   Backend API: http://13.201.222.24:5000/api"
    echo "   Health Check: http://13.201.222.24/health"
    
    echo ""
    echo "📝 Management Commands:"
    echo "   Start: ./start-stockmind.sh"
    echo "   Stop: ./stop-stockmind.sh"
    echo "   Restart: ./restart-stockmind.sh"
    echo "   Logs: pm2 logs"
    echo "   Status: pm2 status"
EOF

echo ""
echo "🎉 StockMind deployment completed successfully!"
echo "=============================================="
echo "✅ Repository cloned and built"
echo "✅ PM2 processes configured"
echo "✅ Nginx reverse proxy setup"
echo "✅ Single-command startup scripts created"
echo ""
echo "🔗 Access your application at:"
echo "   http://13.201.222.24"
echo ""
echo "📝 SSH to server and manage:"
echo "   ssh -i ~/.ssh/ec2-python-ssh.pem ubuntu@13.201.222.24"
echo "   cd stockmind"
echo "   ./start-stockmind.sh    # Start both services"
echo "   ./stop-stockmind.sh     # Stop both services"
echo "   ./restart-stockmind.sh  # Restart both services"
echo "   pm2 logs               # View logs"