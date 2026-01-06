require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// ===============================
// DATABASE
// ===============================
require("./db/connection");

// ===============================
// ROUTES (FRONTEND COMPATIBLE)
// ===============================
app.use("/api/dispatch", require("./routes/dispatchRoutes"));
app.use("/api/dispatch-beta", require("./routes/dispatchRoutes")); // existing

// 🔥 PRODUCT ROUTES (ADDED)
app.use("/api/products", require("./routes/productRoutes"));

// inventory routes
app.use('/api/inventory', require('./routes/inventoryRoutes'));

// bulk uplode routes
app.use('/api/bulk-upload', require('./routes/bulkUploadRoutes'));

// damage recovery routes
app.use('/api/damage-recovery', require('./routes/damageRecoveryRoutes'));

// returns routes
app.use('/api/returns', require('./routes/returnsRoutes'));

// timeline routes
app.use('/api/timeline', require('./routes/timelineRoutes'));

// order tracking routes
app.use('/api/order-tracking', require('./routes/orderTrackingRoutes'));

// self transfer routes
app.use('/api/self-transfer', require('./routes/selfTransferRoutes'));

// permissions routes
app.use('/api', require('./routes/permissionsRoutes'));

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "Inventory Backend",
        timestamp: new Date().toISOString(),
    });
});

// ===============================
// GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
    console.error("[SERVER ERROR]", err);
    res.status(500).json({
        success: false,
        error: err.message || "Internal Server Error",
    });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
    console.log("======================================");
    console.log("🚀 Inventory Backend Started");
    console.log(`🌍 Port: ${PORT}`);
    console.log("======================================");
});