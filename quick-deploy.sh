#!/bin/bash

# Quick StockMind Deployment - Lightweight version
echo "🚀 Quick deployment to server 3.110.194.171..."

SERVER_IP="3.110.194.171"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/ec2-python-ssh.pem"

echo "📡 Connecting to server..."

# Step 1: Basic setup and clone
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
    echo "🔧 Setting up StockMind..."
    
    # Stop any existing processes
    pm2 delete all 2>/dev/null || true
    
    # Remove old directory
    rm -rf stockmind 2>/dev/null || true
    
    # Clone repository
    echo "📥 Cloning repository..."
    git clone https://github.com/shorya8520137-svg/StockMind.git stockmind
    
    cd stockmind
    
    echo "📦 Installing dependencies..."
    npm install
    
    echo "🏗️ Building application..."
    npm run build
    
    echo "✅ Setup completed"
EOF

echo "⏳ Waiting 5 seconds..."
sleep 5

# Step 2: Create startup scripts
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
    cd stockmind
    
    # Create simple startup script
    cat > start-app.sh << 'STARTEOF'
#!/bin/bash
echo "🚀 Starting StockMind..."

cd /home/ubuntu/stockmind

# Start backend
echo "📦 Starting backend on port 5000..."
pm2 start server.js --name "backend" -- --port 5000 &

# Wait a moment
sleep 2

# Start frontend  
echo "🌐 Starting frontend on port 3000..."
pm2 start npm --name "frontend" -- start &

sleep 2

echo "✅ StockMind started!"
echo "🔗 Frontend: http://3.110.194.171:3000"
echo "🔗 Backend: http://3.110.194.171:5000"

pm2 status
STARTEOF

    chmod +x start-app.sh
    
    # Create stop script
    cat > stop-app.sh << 'STOPEOF'
#!/bin/bash
echo "🛑 Stopping StockMind..."
pm2 delete all
echo "✅ Stopped"
STOPEOF

    chmod +x stop-app.sh
    
    echo "✅ Scripts created"
EOF

echo "⏳ Waiting 3 seconds..."
sleep 3

# Step 3: Start the application
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
    cd stockmind
    ./start-app.sh
EOF

echo ""
echo "🎉 Quick deployment completed!"
echo "================================"
echo "🔗 Access your application:"
echo "   Frontend: http://3.110.194.171:3000"
echo "   Backend: http://3.110.194.171:5000"
echo ""
echo "📝 To manage on server:"
echo "   ssh -i ~/.ssh/ec2-python-ssh.pem ubuntu@3.110.194.171"
echo "   cd stockmind"
echo "   ./start-app.sh  # Start"
echo "   ./stop-app.sh   # Stop"
echo "   pm2 logs        # View logs"