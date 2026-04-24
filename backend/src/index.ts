import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { initDb } from "./config/db";
import authRoutes from "./routes/auth";
import examRoutes from "./routes/exam";
import attemptRoutes from "./routes/attempt";
import resultRoutes from "./routes/result";
import statsRoutes from "./routes/stats";
import userRoutes from "./routes/user";
import executeRoutes from "./routes/execute";
import bulkRoutes from "./routes/bulk";
import notificationRoutes from "./routes/notification";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan("dev"));

// Root logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/bulk", bulkRoutes);
app.use("/api/notifications", notificationRoutes);

// Root Welcome Route
app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0a0a0a; color: white; min-height: 100vh;">
      <h1 style="color: #6366f1;">ExamPro API Server</h1>
      <p style="color: #94a3b8;">The backend is running successfully on port 8080.</p>
      <div style="margin-top: 30px; border: 1px solid #1e293b; display: inline-block; padding: 20px; border-radius: 15px; background: #111827;">
        <p>To view the <strong>Website</strong>, please visit:</p>
        <a href="http://127.0.0.1:3000" style="color: #818cf8; font-weight: bold; font-size: 1.2rem; text-decoration: none;">http://127.0.0.1:3000</a>
      </div>
    </div>
  `);
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global Anomaly Fleet - Catching every silent sector crash
app.use((err: any, req: any, res: any, next: any) => {
  console.error("🔥 [CRITICAL_SECTOR_CRASH]:", err);
  res.status(500).json({ 
    error: "Internal Manifold Failure", 
    diagnostic: err.message,
    protocol: "Sector-Safe-V1"
  });
});

import { autoSubmitExpiredAttempts } from "./routes/attempt";

// Start server
const startServer = async () => {
  try {
    await initDb();
    
    // Initiate Background Watchdog (Scan every 1 minute)
    setInterval(autoSubmitExpiredAttempts, 60 * 1000);
    console.log("🛡️  [WATCHDOG_ACTIVE]: Temporal Fail-safe scanner initiated.");

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error("FATAL ERROR DURING STARTUP:", err);
    process.exit(1);
  }
};

startServer();
