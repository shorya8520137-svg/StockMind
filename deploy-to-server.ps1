# StockMind Deployment Script (PowerShell)
# Connects to EC2 server and deploys the application

Write-Host "🚀 Starting StockMind deployment to server..." -ForegroundColor Green

# Server configuration
$SERVER_IP = "13.201.222.24"
$SERVER_USER = "ubuntu"
$SSH_KEY = "~/.ssh/ec2-python-ssh.pem"
$PROJECT_DIR = "stockmind"

Write-Host "📡 Connecting to server: $SERVER_USER@$SERVER_IP" -ForegroundColor Yellow

# Step 1: Create directory and setup server
Write-Host "📁 Setting up server environment..." -ForegroundColor Cyan
ssh -i $SSH_KEY "$SERVER_USER@$SERVER_IP" @"
    # Create project directory
    mkdir -p stockmind
    cd stockmind
    pwd
    
    # Install Node.js if needed
    if ! command -v node &> /dev/null; then
        echo "📦 Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install Git if needed
    if ! command -v git &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y git
    fi
    
    # Install PM2
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
    fi
"@

# Step 2: Clone repository
Write-Host "📥 Cloning StockMind repository..." -ForegroundColor Cyan
ssh -i $SSH_KEY "$SERVER_USER@$SERVER_IP" @"
    cd /home/ubuntu
    
    # Remove existing directory
    if [ -d "stockmind" ]; then
        rm -rf stockmind
    fi
    
    # Clone repository
    git clone https://github.com/shorya8520137-svg/StockMind.git stockmind
    cd stockmind
    ls -la
"@

# Step 3: Install and build
Write-Host "📦 Installing dependencies and building..." -ForegroundColor Cyan
ssh -i $SSH_KEY "$SERVER_USER@$SERVER_IP" @"
    cd /home/ubuntu/stockmind
    
    # Install dependencies
    npm install
    
    # Create environment file
    cat > .env.production << 'EOF'
NODE_ENV=production
PORT=5000
NEXT_PUBLIC_API_BASE=https://api.hunyhuny.org/api
NEXT_PUBLIC_API_TIMEOUT=30000
EOF
    
    # Build application
    npm run build
"@

# Step 4: Start with PM2
Write-Host "🚀 Starting services..." -ForegroundColor Cyan
ssh -i $SSH_KEY "$SERVER_USER@$SERVER_IP" @"
    cd /home/ubuntu/stockmind
    
    # Stop existing processes
    pm2 delete all 2>/dev/null || true
    
    # Start backend
    pm2 start server.js --name stockmind-backend
    
    # Start frontend
    pm2 start npm --name stockmind-frontend -- start
    
    # Save PM2 config
    pm2 save
    pm2 status
"@

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "Frontend: http://13.201.222.24:3000" -ForegroundColor Yellow
Write-Host "Backend: http://13.201.222.24:5000" -ForegroundColor Yellow