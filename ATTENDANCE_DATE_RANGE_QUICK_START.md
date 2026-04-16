# Attendance Date Range Feature - Quick Start

## What's New?

Admins can now set a date range to calculate and track attendance percentages for all team members automatically.

## Quick Setup (2 minutes)

### 1. Access Admin Settings
- Login as Admin
- Navigate to: **Admin Settings** → **Attendance Settings**

### 2. Set Date Range
```
Start Date: January 1, 2024
End Date: February 29, 2024
```

### 3. Click Save
- Settings are saved immediately
- System is ready to calculate attendance

### 4. View Results
- Click **"View Members Attendance"**
- See all members sorted by attendance percentage
- Check status badges for quick assessment

## API Quick Reference

### Save Settings
```bash
POST /api/attendance/settings/date-range
{
  "startDate": "2024-01-01",
  "endDate": "2024-02-29"
}
```

### Get All Members Attendance
```bash
GET /api/attendance/percentage
```

### Get Specific Member Attendance
```bash
GET /api/attendance/percentage/:memberId
```

### Get Current Settings
```bash
GET /api/attendance/settings
```

## Attendance Score Levels

| Score | Status | Color |
|-------|--------|-------|
| 90%+ | Excellent | 🟢 Green |
| 80-89% | Good | 🔵 Blue |
| 70-79% | Average | 🟡 Yellow |
| 60-69% | Poor | 🟠 Orange |
| <60% | Critical | 🔴 Red |

## Key Features

✅ **Automatic Calculation** - Real-time percentage calculation  
✅ **Weekend Exclusion** - Weekends automatically excluded  
✅ **Status Aware** - Present, Late, and Half-day count as present  
✅ **Member Sorting** - Sorted by attendance (highest to lowest)  
✅ **History Tracking** - Change date ranges anytime  
✅ **Reset Option** - Return to default settings anytime  

## What Counts as Present?

- ✅ Status: "Present"
- ✅ Status: "Late"
- ✅ Status: "Half-day"

## What Doesn't Count?

- ❌ Absent days
- ❌ Weekends
- ❌ Holidays (excluded from total working days)

## Common Tasks

### Change Attendance Period
1. Go to Attendance Settings
2. Update dates
3. Click Save Settings
4. Click View Members Attendance

### Reset to Default
1. Click the Reset button (↻)
2. Confirm in dialog
3. Settings return to defaults (no date range set)

### Export Member Data
Currently displayed in dialog, can be:
- Copied to spreadsheet
- Printed for reports
- Used for performance reviews

## Troubleshooting

**Q: Settings won't save?**  
A: Verify both dates are filled and start date < end date

**Q: Attendance showing 0%?**  
A: Ensure attendance records exist for that date range

**Q: Can't access settings?**  
A: You need Admin role

## Technical Details

- **Backend**: TypeScript/Node.js with Express
- **Database**: MongoDB with CompanySettings collection
- **Frontend**: React with TypeScript
- **Endpoints**: RESTful API at `/api/attendance`
- **Authorization**: JWT token required, Admin role required

## Files Modified

### Backend
- `backend/src/models/enhancedModels.ts` - Added settings fields
- `backend/src/services/attendanceSettings.service.ts` - Calculation logic
- `backend/src/controllers/attendanceSettings.controller.ts` - API handlers
- `backend/src/routes.ts` - New API endpoints

### Frontend
- `frontend/src/pages/AttendanceSettings.tsx` - Admin UI component

## Next Steps

1. **Deploy Backend**: Push backend changes to production
2. **Deploy Frontend**: Push frontend changes and build
3. **Access Settings**: Admin logs in and configures date range
4. **Monitor**: Regular check-in on member attendance

## Support Commands

```bash
# Test API locally
curl http://localhost:5000/api/attendance/settings \
  -H "Authorization: Bearer your_token"

# Check MongoDB connection
npm run test:mongo

# Restart backend
npm run dev:backend
```

---

**Version**: 1.0  
**Last Updated**: April 16, 2026  
**Status**: ✅ Ready for Production
