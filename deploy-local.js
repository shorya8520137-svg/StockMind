const { execSync } = require("child_process");

function run(cmd) {
    console.log("➡️", cmd);
    try {
        execSync(cmd, { stdio: "inherit" });
    } catch (err) {
        console.error("❌ Command failed:", cmd);
        throw err;
    }
}

try {
    console.log("🚀 Deploying StockMind locally on server...\n");

    // 1. Pull latest code
    console.log("📥 Pulling latest code from GitHub...");
    run("git pull origin main");

    // 2. Install ALL dependencies (including bcrypt)
    console.log("\n📦 Installing dependencies...");
    run("npm install");

    // 3. Build frontend
    console.log("\n🏗️ Building frontend...");
    run("npm run build");

    // 4. Stop existing processes safely
    console.log("\n🛑 Stopping existing processes...");
    run("pm2 delete stockmind-backend 2>/dev/null || true");
    run("pm2 delete stockmind-frontend 2>/dev/null || true");

    // 5. Start backend
    console.log("\n📦 Starting backend...");
    run("pm2 start server.js --name stockmind-backend --max-memory-restart 300M");

    // 6. Start frontend
    console.log("\n🌐 Starting frontend...");
    run("pm2 start npm --name stockmind-frontend -- start --max-memory-restart 300M");

    // 7. Save PM2 state
    console.log("\n💾 Saving PM2 configuration...");
    run("pm2 save");

    // 8. Check status
    console.log("\n📊 Final status:");
    run("pm2 status");

    console.log("\n✅ Deployment completed safely!");
    console.log("🔗 Frontend: http://13.203.223.248:3000");
    console.log("🔗 Backend: http://13.203.223.248:5000");

} catch (err) {
    console.error("\n❌ Deployment failed. Stopping.");
    console.error(err.message);
    process.exit(1);
}
