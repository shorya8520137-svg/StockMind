#!/bin/bash

# Simple deployment launcher script
echo "🚀 Deploying StockMind to EC2 Server..."
echo "======================================="

# Check if deployment script exists
if [ ! -f "deploy-to-server.sh" ]; then
    echo "❌ deploy-to-server.sh not found!"
    exit 1
fi

# Make deployment script executable
chmod +x deploy-to-server.sh

# Run the deployment
echo "📡 Starting deployment process..."
./deploy-to-server.sh

echo ""
echo "🎉 Deployment process completed!"
echo "Check the output above for any errors."