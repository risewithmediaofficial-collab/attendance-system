# Quick Uptime Monitoring & Cron Jobs Reference

## ⚡ Quick Start

### Check If Everything Is Running
```bash
# Quick health check
curl https://your-app-url.com/ping

# Full uptime dashboard
curl https://your-app-url.com/health/uptime

# Cron jobs status
curl https://your-app-url.com/health/cron-jobs
```

## 🔄 Automated Services (Running by Default)

| Service | Interval | Purpose |
|---------|----------|---------|
| **Warmup Service** | Every 10 min | Prevents cold starts |
| **Self-Ping** | Every 5 min (prod) | Keeps server alive |
| **Auto Checkout** | 6 PM daily | End-of-day checkout |
| **Task Reminders** | 9 AM daily | Send task alerts |
| **Log Cleanup** | 2 AM Sunday | Delete old logs |
| **Daily Report** | 11 PM daily | Generate reports |

## 🧪 Testing & Troubleshooting

### Manually Run a Job (For Testing)
```bash
# Test auto checkout
curl -X POST https://your-app-url.com/api/cron/run \
  -H "Content-Type: application/json" \
  -d '{"jobName": "autoCheckout"}'

# Test reminders
curl -X POST https://your-app-url.com/api/cron/run \
  -H "Content-Type: application/json" \
  -d '{"jobName": "overdueReminders"}'

# Test cleanup
curl -X POST https://your-app-url.com/api/cron/run \
  -H "Content-Type: application/json" \
  -d '{"jobName": "cleanupLogs"}'

# Test daily report
curl -X POST https://your-app-url.com/api/cron/run \
  -H "Content-Type: application/json" \
  -d '{"jobName": "dailyReport"}'
```

### Monitor Server Health
```bash
# Simple ping (fastest)
curl https://your-app-url.com/ping

# Full health with memory info
curl https://your-app-url.com/health

# Uptime dashboard (all services)
curl https://your-app-url.com/health/uptime

# Database health only
curl https://your-app-url.com/health/database

# Self-ping status (production only)
curl https://your-app-url.com/health/self-ping
```

## 📊 Monitoring Setup (Recommended)

### Option 1: UptimeRobot (Recommended)
1. Go to uptimerobot.com
2. Create Monitor → "HTTP(s)"
3. Set URL: `https://your-app-url.com/ping`
4. Set check interval: 5 minutes
5. Enable email/SMS alerts

### Option 2: Custom Dashboard
Monitor these URLs in a simple dashboard:
- `/health/uptime` - Shows everything
- `/health/cron-jobs` - Current jobs
- `/health` - Full details

### Option 3: Script Monitoring
```bash
#!/bin/bash
# Save as monitor.sh
while true; do
  STATUS=$(curl -s https://your-app-url.com/ping | grep "ok")
  if [ -z "$STATUS" ]; then
    echo "❌ Server down at $(date)"
    # Send alert here
  else
    echo "✅ Server up at $(date)"
  fi
  sleep 300  # Check every 5 minutes
done
```

## 🎯 Scheduled Jobs Details

### Auto Checkout (6 PM)
```
When: 18:00 (6:00 PM) daily
Why: Prevents users from being checked in indefinitely
Test: POST /api/cron/run with jobName: "autoCheckout"
```

### Task Reminders (9 AM)
```
When: 09:00 (9:00 AM) daily
Why: Reminds users of tasks due today
Test: POST /api/cron/run with jobName: "overdueReminders"
```

### Log Cleanup (2 AM Sunday)
```
When: 02:00 (2:00 AM) on Sundays
Why: Keeps database clean (keeps 90 days of logs)
Test: POST /api/cron/run with jobName: "cleanupLogs"
```

### Daily Report (11 PM)
```
When: 23:00 (11:00 PM) daily
Why: Generates attendance summary for the day
Test: POST /api/cron/run with jobName: "dailyReport"
```

## 🔧 Configuration

All times in **Asia/Kolkata** timezone. To change:

Edit `backend/src/services/cron.service.ts`:

```typescript
// Example: Change auto checkout from 6 PM to 5 PM
cron.schedule('0 17 * * *', async () => {
  await this.autoCheckoutAllUsers();
}, {
  timezone: 'Asia/Kolkata'
});

// CRON Format: minute hour day month dayOfWeek
// 0 17 * * * = 5:00 PM daily
// 0 9 * * 1 = 9:00 AM Mondays only
// */15 * * * * = Every 15 minutes
```

## 📍 All Available Endpoints

```
GET  /                          - Info & endpoint list
GET  /health                    - Full health check
GET  /ping                      - Quick ping
GET  /health/database          - Database health
GET  /health/self-ping         - Self-ping status
GET  /health/uptime            - Uptime dashboard ⭐
GET  /health/cron-jobs         - Cron jobs info ⭐
POST /api/cron/run             - Manually run a job ⭐
```

## 💡 Pro Tips

1. **Monitor `/health/uptime`** - Shows everything in one response
2. **Use `/api/cron/run`** - Test jobs before they run automatically
3. **Check logs** - Server logs show when jobs execute
4. **Set email alerts** - Configure UptimeRobot for downtime notifications
5. **Weekly review** - Check `/health/uptime` weekly for patterns

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Jobs not running | Check if `NODE_ENV=production` |
| `/ping` fails | Server is down |
| Self-ping not active | Only works in production |
| High memory | Job may have memory leak |
| All endpoints down | Database or server crashed |

## 🚀 Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `BACKEND_URL` to your domain
- [ ] Set `PORT` environment variable
- [ ] Set `MONGODB_URI` for database
- [ ] Run `npm run build && npm start`
- [ ] Test `/ping` endpoint
- [ ] Test `/health/uptime` endpoint
- [ ] Configure external monitoring
- [ ] Set up alert notifications

## 📋 Useful Commands

```bash
# Start server with cron jobs
npm run dev

# Build for production
npm run build

# Start production build
npm start

# Test health endpoints
npm test:health
```

---

**Next Steps:**
1. Deploy to production
2. Configure UptimeRobot or similar monitoring
3. Test manual job runs with `/api/cron/run`
4. Set up alerts for downtime
5. Monitor `/health/uptime` weekly

**Full Details:** See `UPTIME_MONITORING_GUIDE.md`
