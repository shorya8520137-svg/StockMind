const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd, ignoreError = false) {
    console.log("➡️", cmd);
    try {
        execSync(cmd, { stdio: "inherit", shell: "/bin/bash" });
    } catch (err) {
        if (!ignoreError) {
            console.error("❌ Command failed:", cmd);
            throw err;
        }
    }
}

function wait(seconds) {
    console.log(`⏳ Waiting ${seconds} seconds...`);
    execSync(`sleep ${seconds}`);
}

try {
    console.log("🚀 Deploying StockMind locally on server...\n");

    // 1. Pull latest code
    console.log("📥 Pulling latest code from GitHub...");
    run("git pull origin main");
    wait(2);

    // 2. Clean corrupted node_modules (force remove)
    console.log("\n🧹 Cleaning node_modules...");
    if (fs.existsSync("node_modules")) {
        console.log("Removing node_modules folder...");
        run("rm -rf node_modules", true);
        wait(3);
    }
    if (fs.existsSync("package-lock.json")) {
        console.log("Removing package-lock.json...");
        run("rm -f package-lock.json", true);
    }
    wait(2);

    // 3. Install dependencies with minimal load
    console.log("\n� SInstalling dependencies (this may take a while)...");
    console.log("⚠️ Using minimal memory to prevent server crash...");
    run("npm install --prefer-offline --no-audit --no-fund --loglevel=error");
    wait(3);

    // 4. Stop existing processes safely
    console.log("\n� Stopping existing processes...");
    run("pm2 delete all", true);
    wait(2);

    // 5. Start backend
    console.log("\n� Starting backend on port 5000...");
    run("pm2 start server.js --name backend --max-memory-restart 200M");
    wait(3);

    // 6. Start frontend in dev mode
    console.log("\n🌐 Starting frontend in dev mode on port 3000...");
    run('pm2 start npm --name frontend --max-memory-restart 200M -- run dev');
    wait(3);

    // 7. Save PM2 state
    console.log("\n💾 Saving PM2 configuration...");
    run("pm2 save");

    // 8. Check status
    console.log("\n📊 Final status:");
    run("pm2 status");

    console.log("\n✅ Deployment completed!");
    console.log("🔗 Frontend: http://13.203.223.248:3000");
    console.log("🔗 Backend: http://13.203.223.248:5000");
    console.log("\n⚠️ Running in development mode (no build required)");
    console.log("\n📝 To check logs:");
    console.log("   pm2 logs backend");
    console.log("   pm2 logs frontend");

} catch (err) {
    console.error("\n❌ Deployment failed!");
    console.error(err.message);
    console.log("\n🔍 Check what went wrong:");
    console.log("   pm2 logs");
    console.log("   pm2 status");
    process.exit(1);
}
