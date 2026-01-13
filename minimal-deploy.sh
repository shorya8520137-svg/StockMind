#!/bin/bash

# Minimal StockMind Deployment
echo "🚀 Minimal deployment to 3.110.194.171..."

# Just test connection first
ssh -i ~/.ssh/ec2-python-ssh.pem ubuntu@3.110.194.171 "echo 'Connected successfully'"

echo "⏳ 3 seconds..."
sleep 3

# Clone repo only
ssh -i ~/.ssh/ec2-python-ssh.pem ubuntu@3.110.194.171 "rm -rf stockmind; git clone https://github.com/shorya8520137-svg/StockMind.git stockmind"

echo "⏳ 5 seconds..."
sleep 5

# Install and build
ssh -i ~/.ssh/ec2-python-ssh.pem ubuntu@3.110.194.171 "cd stockmind && npm install"

echo "⏳ 3 seconds..."
sleep 3

ssh -i ~/.ssh/ec2-python-ssh.pem ubuntu@3.110.194.171 "cd stockmind && npm run build"

echo "⏳ 3 seconds..."
sleep 3

# Create start script
ssh -i ~/.ssh/ec2-python-ssh.pem ubuntu@3.110.194.171 'cd stockmind && echo "#!/bin/bash
pm2 delete all 2>/dev/null
pm2 start server.js --name backend
pm2 start npm --name frontend -- start
pm2 status" > start.sh && chmod +x start.sh'

echo "⏳ 2 seconds..."
sleep 2

# Start app
ssh -i ~/.ssh/ec2-python-ssh.pem ubuntu@3.110.194.171 "cd stockmind && ./start.sh"

echo "✅ Done! Check: http://3.110.194.171:3000"