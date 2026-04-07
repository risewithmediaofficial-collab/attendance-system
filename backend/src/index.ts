import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { databaseService } from "./services/database.service.js";
import { ServerWarmupService } from "./services/serverWarmup.service.js";
import { ensureDefaultUsers } from "./ensureDefaults.js";
import { apiRouter } from "./routes.js";
import { healthCheck, ping, databaseHealthCheck } from "./controllers/health.controller.js";

const port = Number(process.env.PORT) || 4000;

// Enhanced health check function
async function checkHealth() {
  try {
    const dbStatus = databaseService.getConnectionStatus();
    const warmupService = ServerWarmupService.getInstance();
    const warmupStatus = warmupService.getWarmupStatus();
    
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      cache: {
        warmupLast: warmupStatus.lastWarmup,
        warmupNextIn: warmupStatus.nextWarmupIn
      },
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
      }
    };
  } catch (error) {
    return {
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Initialize database connection
await databaseService.connect();
await ensureDefaultUsers();

// Start server warmup service
const warmupService = ServerWarmupService.getInstance();
warmupService.startWarmup();

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));

// Request logging middleware (only in production)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoints (CRITICAL for Render monitoring)
app.get("/health", async (_req, res) => {
  try {
    const health = await checkHealth();
    res.status(health.status === "ok" ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Health check failed"
    });
  }
});

// Lightweight ping endpoint (for uptime monitoring)
app.get("/ping", ping);

// Database health check (separate from main health check)
app.get("/health/database", databaseHealthCheck);

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    message: "RISE WITH MEDIA - Attendance System API",
    status: "running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      ping: "/ping",
      database: "/health/database",
      api: "/api",
      auth: "/api/auth/login"
    },
    performance: {
      warmupEnabled: true,
      connectionPooling: true,
      caching: true
    }
  });
});

app.use("/api", apiRouter());

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
  });
});

// 404 handler
app.use("*", (_req, res) => {
  res.status(404).json({
    error: "Not found",
    message: "The requested endpoint does not exist"
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  warmupService.stopWarmup();
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  warmupService.stopWarmup();
  await databaseService.disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`API listening on port ${port} (MongoDB)`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Ping endpoint: http://localhost:${port}/ping`);
  console.log('Performance optimizations enabled: Connection pooling, caching, warmup service');
});
