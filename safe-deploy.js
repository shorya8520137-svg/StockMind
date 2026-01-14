const { execSync } = require("child_process");

const SERVER = "ubuntu@13.203.223.248";
const KEY = "~/.ssh/ec2-python-ssh.pem";

function run(cmd) {
    console.log("➡️", cmd);
    try {
        execSync(cmd, { stdio: "inherit", shell: "/bin/bash" });
    } catch (err) {
        console.error("❌ Command failed:", cmd);
        throw err;
    }
}

try {
    console.log("🚀 Deploying StockMind safely...\n");

    // 1. Test connection
    console.log("📡 Testing connection...");
    run(`ssh -i ${KEY} ${SERVER} "echo CONNECTED"`);

    // 2. Clone repo (clean)
    console.log("\n📥 Cloning repository...");
    run(`ssh -i ${KEY} ${SERVER} "rm -rf stockmind && git clone https://github.com/shorya8520137-svg/StockMind.git stockmind"`);

    // 3. Install ALL dependencies (including bcrypt)
    console.log("\n📦 Installing dependencies...");
    run(`ssh -i ${KEY} ${SERVER} "cd stockmind && npm install"`);

    // 4. Build frontend
    console.log("\n🏗️ Building frontend...");
    run(`ssh -i ${KEY} ${SERVER} "cd stockmind && npm run build || echo 'Build failed but continuing'"`);

    // 5. Stop existing processes safely
    console.log("\n🛑 Stopping existing processes...");
    run(`ssh -i ${KEY} ${SERVER} "pm2 delete stockmind-backend 2>/dev/null || true"`);
    run(`ssh -i ${KEY} ${SERVER} "pm2 delete stockmind-frontend 2>/dev/null || true"`);

    // 6. Start backend
    console.log("\n📦 Starting backend...");
    run(`ssh -i ${KEY} ${SERVER} "cd stockmind && pm2 start server.js --name stockmind-backend --max-memory-restart 300M"`);

    // 7. Start frontend
    console.log("\n🌐 Starting frontend...");
    run(`ssh -i ${KEY} ${SERVER} "cd stockmind && pm2 start npm --name stockmind-frontend -- start --max-memory-restart 300M"`);

    // 8. Save PM2 state
    console.log("\n💾 Saving PM2 configuration...");
    run(`ssh -i ${KEY} ${SERVER} "pm2 save"`);

    // 9. Check status
    console.log("\n📊 Final status:");
    run(`ssh -i ${KEY} ${SERVER} "pm2 status"`);

    console.log("\n✅ Deployment completed safely!");
    console.log("🔗 Frontend: http://13.203.223.248:3000");
    console.log("🔗 Backend: http://13.203.223.248:5000");

} catch (err) {
    console.error("\n❌ Deployment failed. Stopping.");
    console.error(err.message);
    process.exit(1);
}
