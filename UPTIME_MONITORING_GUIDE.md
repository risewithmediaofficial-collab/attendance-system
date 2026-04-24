# Uptime Monitoring & Cron Jobs Guide

## Overview

Your application now has a comprehensive uptime monitoring and cron job system to ensure continuous operation and automated maintenance tasks.

## System Architecture

### Components

1. **ServerWarmupService** - Prevents cold starts
   - Runs every 10 minutes
   - Calls `/health` endpoint internally
   - Logs memory usage periodically

2. **SelfPingService** - Production uptime monitoring
   - Runs every 5 minutes in production
   - Pings `/ping` endpoint
   - Prevents server idling on Render/other platforms

3. **CronJobService** - Scheduled background jobs
   - Auto-checkout users at 6 PM daily
   - Send overdue task reminders at 9 AM daily
   - Clean old activity logs at 2 AM Sundays
   - Generate daily attendance report at 11 PM daily
   - All times in Asia/Kolkata timezone

## Health Check Endpoints

### 1. Main Health Check
```
GET /health
```
Returns comprehensive server health status including:
- Database connection status
- Uptime
- Memory usage
- Environment info
- Warmup service status

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-24T10:30:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "cache": {
    "warmupLast": "2026-04-24T10:30:00.000Z",
    "warmupNextIn": 300000
  },
  "environment": "production",
  "version": "1.0.0",
  "memory": {
    "used": 145.32,
    "total": 256.00,
    "external": 8.50
  }
}
```

### 2. Lightweight Ping
```
GET /ping
```
Quick health check for monitoring services. Returns minimal response.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-24T10:30:00.000Z"
}
```

### 3. Database Health
```
GET /health/database
```
Database-specific health check.

### 4. Self-Ping Status
```
GET /health/self-ping
```
Shows status of the self-ping service.

**Response:**
```json
{
  "service": "self-ping",
  "enabled": true,
  "lastPing": "2026-04-24T10:30:00.000Z",
  "pingCount": 42,
  "status": "running",
  "timestamp": "2026-04-24T10:30:00.000Z"
}
```

### 5. Uptime Monitoring Dashboard
```
GET /health/uptime
```
Comprehensive uptime status with all service information.

**Response:**
```json
{
  "service": "uptime-monitoring",
  "serverStatus": "online",
  "uptime": {
    "seconds": 86400,
    "formatted": "1d 0h 0m",
    "days": 1,
    "hours": 0,
    "minutes": 0
  },
  "services": {
    "warmup": {
      "enabled": true,
      "lastRun": "2026-04-24T10:30:00.000Z",
      "nextRunIn": 480,
      "interval": "every 10 minutes"
    },
    "selfPing": {
      "enabled": true,
      "status": "running",
      "interval": "every 5 minutes"
    },
    "cronJobs": {
      "enabled": true,
      "jobs": [
        {
          "name": "Auto Checkout",
          "schedule": "6 PM daily (18:00)",
          "timezone": "Asia/Kolkata"
        },
        ...
      ]
    }
  },
  "memory": {
    "heapUsed": 145.32,
    "heapTotal": 256.00,
    "external": 8.50,
    "unit": "MB"
  },
  "timestamp": "2026-04-24T10:30:00.000Z",
  "environment": "production"
}
```

### 6. Cron Jobs Status
```
GET /health/cron-jobs
```
Lists all scheduled cron jobs.

**Response:**
```json
{
  "service": "cron-jobs",
  "status": "running",
  "jobs": [
    {
      "id": "autoCheckout",
      "name": "Auto Checkout",
      "schedule": "0 18 * * *",
      "scheduleDescription": "6 PM daily",
      "timezone": "Asia/Kolkata",
      "description": "Automatically checkout users at end of day"
    },
    ...
  ],
  "manualTrigger": {
    "description": "POST to /api/cron/run with jobName in body",
    "exampleJobNames": ["autoCheckout", "overdueReminders", "cleanupLogs", "dailyReport"]
  },
  "timestamp": "2026-04-24T10:30:00.000Z"
}
```

## Cron Jobs Management

### Manual Job Execution
```
POST /api/cron/run
Content-Type: application/json

{
  "jobName": "autoCheckout"
}
```

**Valid Job Names:**
- `autoCheckout` - Manually trigger end-of-day checkout
- `overdueReminders` - Send task reminders immediately
- `cleanupLogs` - Clean old activity logs immediately
- `dailyReport` - Generate daily report immediately

**Response:**
```json
{
  "success": true,
  "message": "Cron job 'autoCheckout' executed successfully",
  "timestamp": "2026-04-24T10:30:00.000Z"
}
```

## Monitoring Setup

### External Monitoring Services

#### UptimeRobot Configuration
1. Create a new monitor
2. Set URL to: `https://your-app-url.com/ping`
3. Set check interval: 5 minutes
4. Set response time alert: > 10 seconds
5. Enable email notifications

#### Alternatively Monitor `/health/uptime`
For detailed uptime dashboard:
- URL: `https://your-app-url.com/health/uptime`
- Check interval: 10 minutes
- Parse JSON response for alerts

### Dashboard URLs
Monitor these URLs on an external dashboard:
- **Quick Health**: `https://your-app-url.com/ping`
- **Full Health**: `https://your-app-url.com/health`
- **Uptime Dashboard**: `https://your-app-url.com/health/uptime`
- **Cron Status**: `https://your-app-url.com/health/cron-jobs`

## Scheduled Jobs

### 1. Auto Checkout (6 PM Daily)
- **Time**: 18:00 (6:00 PM)
- **Timezone**: Asia/Kolkata
- **Description**: Automatically checks out all checked-in users at end of day
- **Logs to**: Activity logs
- **Manual trigger**: `POST /api/cron/run` with `jobName: "autoCheckout"`

### 2. Overdue Task Reminders (9 AM Daily)
- **Time**: 09:00 (9:00 AM)
- **Timezone**: Asia/Kolkata
- **Description**: Sends reminders for tasks past their due date
- **Groups tasks**: By assigned user
- **Logs to**: Activity logs
- **Manual trigger**: `POST /api/cron/run` with `jobName: "overdueReminders"`

### 3. Clean Old Logs (2 AM Every Sunday)
- **Time**: 02:00 (2:00 AM)
- **Day**: Sunday
- **Timezone**: Asia/Kolkata
- **Description**: Deletes activity logs older than 90 days
- **Retention**: 90 days
- **Manual trigger**: `POST /api/cron/run` with `jobName: "cleanupLogs"`

### 4. Daily Attendance Report (11 PM Daily)
- **Time**: 23:00 (11:00 PM)
- **Timezone**: Asia/Kolkata
- **Description**: Generates and stores daily attendance report
- **Logs to**: Activity logs and reports
- **Manual trigger**: `POST /api/cron/run` with `jobName: "dailyReport"`

## Troubleshooting

### Jobs Not Running
1. Check server uptime: `GET /health/uptime`
2. Verify timezone is set correctly (should be Asia/Kolkata)
3. Check logs for cron job error messages
4. Manually trigger job to test: `POST /api/cron/run`

### Self-Ping Failures
- Only active in production
- Check that `NODE_ENV=production` in environment
- Verify `BACKEND_URL` environment variable is set correctly

### High Memory Usage
- Check memory in `/health` response
- May indicate memory leak in a job
- Monitor with `/health/uptime` regularly

### Jobs Running Multiple Times
- Ensure server is not running multiple instances
- Check for duplicate cron job initialization
- Verify process.env.NODE_ENV is consistent

## Best Practices

1. **Monitor Regularly**: Check `/health/uptime` at least daily
2. **Set Alerts**: Configure external monitoring for downtime alerts
3. **Test Manually**: Use `/api/cron/run` to verify jobs work
4. **Review Logs**: Check server logs for job execution details
5. **Adjust Schedules**: Change times in `cron.service.ts` if needed
6. **Database Maintenance**: Ensure database stays healthy with weekly checks

## Environment Variables

```env
# Server configuration
PORT=4000
NODE_ENV=production
BACKEND_URL=https://your-app-url.com

# Database
MONGODB_URI=mongodb+srv://...

# For self-ping service (optional)
CORS_ORIGIN=*
```

## Implementation Details

All services are initialized in `backend/src/index.ts`:

```typescript
// Initialize cron jobs
const cronJobService = new CronJobService();
cronJobService.startAllJobs();

// Start warmup service
const warmupService = ServerWarmupService.getInstance();
warmupService.startWarmup();

// Start self-ping (production only)
const selfPingService = SelfPingService.getInstance();
if (process.env.NODE_ENV === 'production') {
  selfPingService.startSelfPing();
}
```

## Deployment Notes

### Render Deployment
- Self-ping service automatically prevents cold starts
- Warmup service runs every 10 minutes
- All services initialize on server startup
- Graceful shutdown implemented via SIGTERM/SIGINT handlers

### Other Platforms
- Services will work on any Node.js platform
- Adjust `BACKEND_URL` environment variable for your domain
- Set `NODE_ENV=production` to enable self-ping service

## API Reference Summary

| Endpoint | Method | Purpose | Frequency |
|----------|--------|---------|-----------|
| `/health` | GET | Full health status | Monitor every 5-10 min |
| `/ping` | GET | Quick health check | Monitor every 5 min |
| `/health/uptime` | GET | Uptime dashboard | Monitor every 10 min |
| `/health/cron-jobs` | GET | Cron jobs info | Check daily |
| `/api/cron/run` | POST | Manual job trigger | On-demand |

---

**Status**: ✅ Fully Implemented and Active
**Last Updated**: 2026-04-24
