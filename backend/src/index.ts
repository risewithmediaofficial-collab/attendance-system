import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { databaseService } from "./services/database.service.js";
import { ServerWarmupService } from "./services/serverWarmup.service.js";
import { SelfPingService } from "./services/selfPing.service.js";
import { CronJobService } from "./services/cron.service.js";
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

// Start self-ping service (prevents Render cold starts)
const selfPingService = SelfPingService.getInstance();
if (process.env.NODE_ENV === 'production') {
  selfPingService.startSelfPing();
}

// Start cron jobs service
const cronJobService = new CronJobService();
cronJobService.startAllJobs();

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

// Self-ping service status (for monitoring)
app.get("/health/self-ping", (_req, res) => {
  const status = selfPingService.getStatus();
  res.status(200).json({
    service: "self-ping",
    ...status,
    timestamp: new Date().toISOString()
  });
});

// Uptime monitoring dashboard endpoint
app.get("/health/uptime", (_req, res) => {
  const warmupStatus = warmupService.getWarmupStatus();
  const selfPingStatus = selfPingService.getStatus();
  const uptimeSeconds = process.uptime();
  const uptimeDays = Math.floor(uptimeSeconds / 86400);
  const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

  res.status(200).json({
    service: "uptime-monitoring",
    serverStatus: "online",
    uptime: {
      seconds: Math.round(uptimeSeconds),
      formatted: `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`,
      days: uptimeDays,
      hours: uptimeHours,
      minutes: uptimeMinutes
    },
    services: {
      warmup: {
        enabled: true,
        lastRun: warmupStatus.lastWarmup,
        nextRunIn: Math.round(warmupStatus.nextWarmupIn / 1000),
        interval: "every 10 minutes"
      },
      selfPing: {
        enabled: process.env.NODE_ENV === 'production',
        status: selfPingStatus,
        interval: "every 5 minutes"
      },
      cronJobs: {
        enabled: true,
        jobs: [
          {
            name: "Auto Checkout",
            schedule: "6 PM daily (18:00)",
            timezone: "Asia/Kolkata"
          },
          {
            name: "Overdue Task Reminders",
            schedule: "9 AM daily (09:00)",
            timezone: "Asia/Kolkata"
          },
          {
            name: "Clean Old Logs",
            schedule: "2 AM every Sunday (02:00)",
            timezone: "Asia/Kolkata"
          },
          {
            name: "Daily Attendance Report",
            schedule: "11 PM daily (23:00)",
            timezone: "Asia/Kolkata"
          }
        ]
      }
    },
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
      unit: "MB"
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

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
      selfPing: "/health/self-ping",
      uptime: "/health/uptime",
      cronJobs: "/health/cron-jobs",
      api: "/api",
      auth: "/api/auth/login"
    },
    performance: {
      warmupEnabled: true,
      selfPingEnabled: process.env.NODE_ENV === 'production',
      cronJobsEnabled: true,
      connectionPooling: true,
      caching: true
    }
  });
});

// Cron jobs management endpoint
app.get("/health/cron-jobs", (_req, res) => {
  res.status(200).json({
    service: "cron-jobs",
    status: "running",
    jobs: [
      {
        id: "autoCheckout",
        name: "Auto Checkout",
        schedule: "0 18 * * *",
        scheduleDescription: "6 PM daily",
        timezone: "Asia/Kolkata",
        description: "Automatically checkout users at end of day"
      },
      {
        id: "overdueReminders",
        name: "Overdue Task Reminders",
        schedule: "0 9 * * *",
        scheduleDescription: "9 AM daily",
        timezone: "Asia/Kolkata",
        description: "Send reminders for overdue tasks"
      },
      {
        id: "cleanupLogs",
        name: "Clean Old Activity Logs",
        schedule: "0 2 * * 0",
        scheduleDescription: "2 AM every Sunday",
        timezone: "Asia/Kolkata",
        description: "Delete activity logs older than 90 days"
      },
      {
        id: "dailyReport",
        name: "Daily Attendance Report",
        schedule: "0 23 * * *",
        scheduleDescription: "11 PM daily",
        timezone: "Asia/Kolkata",
        description: "Generate daily attendance report"
      }
    ],
    manualTrigger: {
      description: "POST to /api/cron/run with jobName in body",
      exampleJobNames: ["autoCheckout", "overdueReminders", "cleanupLogs", "dailyReport"]
    },
    timestamp: new Date().toISOString()
  });
});

app.use("/api", apiRouter());

// Cron job manual trigger endpoint (for testing and admin operations)
app.post("/api/cron/run", async (req, res) => {
  try {
    const { jobName } = req.body;
    
    if (!jobName) {
      return res.status(400).json({
        error: "Missing jobName",
        validJobs: ["autoCheckout", "overdueReminders", "cleanupLogs", "dailyReport"]
      });
    }

    const validJobs = ["autoCheckout", "overdueReminders", "cleanupLogs", "dailyReport"];
    if (!validJobs.includes(jobName)) {
      return res.status(400).json({
        error: "Invalid jobName",
        validJobs
      });
    }

    console.log(`⚡ Manually triggering cron job: ${jobName}`);
    await cronJobService.runJobManually(jobName);
    
    res.status(200).json({
      success: true,
      message: `Cron job '${jobName}' executed successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error running cron job:", error);
    res.status(500).json({
      error: "Failed to run cron job",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
  }
});

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
