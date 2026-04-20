# Work Schedule Quick Reference

## What Was Added

Your attendance system now has configurable work schedule times:

| Time | Value |
|------|-------|
| **Office In Time** | 9:30 AM |
| **Office Out Time** | 4:30 PM |
| **Lunch Start** | 12:30 PM |
| **Lunch End** | 1:30 PM |
| **Auto-Checkout** | 4:45 PM |

---

## Where to Configure

### Admin Settings Page
1. Go to **Attendance Settings** (Admin only)
2. Look for **Office Hours Configuration** section (green header)
3. Update the 4 time fields
4. Click **Save Office Hours**

---

## What Changed in Your Database

### New Fields in `CompanySettings`:
```
lunchStartTime: "12:30"
lunchEndTime: "13:30"
```

### Updated Fields:
```
officeStartTime: "09:30"  (was 09:00)
officeEndTime: "16:30"    (was 18:00)
autoCheckoutTime: "16:45" (was 18:30)
```

### New Fields in `AttendanceRecord`:
```
lunchStartTime: String (optional)
lunchEndTime: String   (optional)
```

---

## API Endpoints

### Get Current Settings
```
GET /api/attendance/settings
Authorization: Bearer TOKEN

Response:
{
  "officeStartTime": "09:30",
  "officeEndTime": "16:30",
  "lunchStartTime": "12:30",
  "lunchEndTime": "13:30",
  ...
}
```

### Update Office Hours
```
POST /api/attendance/settings/office-hours
Authorization: Bearer TOKEN
Content-Type: application/json

Body:
{
  "officeStartTime": "09:30",
  "officeEndTime": "16:30",
  "lunchStartTime": "12:30",
  "lunchEndTime": "13:30"
}

Response:
{
  "success": true,
  "data": { ... },
  "message": "Office hours updated successfully"
}
```

---

## Frontend Usage

The `AttendanceSettings` page now has:
- ✅ Time input fields for office hours
- ✅ Time input fields for lunch break
- ✅ Display of current settings
- ✅ Save button
- ✅ Success/error notifications

---

## How It's Used

1. **Check-In System** - Uses `officeStartTime` to determine if employee is late
2. **Hour Calculation** - Can use `lunchStartTime` and `lunchEndTime` to exclude lunch from working hours
3. **Auto-Checkout** - System can auto-checkout at `autoCheckoutTime`
4. **Reports** - Settings displayed in attendance configuration area

---

## Testing

### Test via Browser
1. Open Admin Settings
2. Update a time (e.g., change to 10:00 AM)
3. Click Save
4. Refresh page
5. Verify the time is still updated ✅

### Test via API
```bash
# Get settings
curl http://localhost:4000/api/attendance/settings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update settings
curl -X POST http://localhost:4000/api/attendance/settings/office-hours \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "officeStartTime": "09:30",
    "officeEndTime": "16:30",
    "lunchStartTime": "12:30",
    "lunchEndTime": "13:30"
  }'
```

---

## Files Modified

- ✅ `backend/src/models/enhancedModels.ts`
- ✅ `backend/src/services/attendanceSettings.service.ts`
- ✅ `backend/src/controllers/attendanceSettings.controller.ts`
- ✅ `backend/src/routes.ts`
- ✅ `frontend/src/pages/AttendanceSettings.tsx`

---

## Summary

✅ **In Time** (9:30 AM) - Added
✅ **Lunch Break** (12:30 - 1:30 PM) - Added
✅ **Out Time** (4:30 PM) - Added
✅ **Database Fields** - Added
✅ **API Endpoint** - Added
✅ **Admin UI** - Added
✅ **Ready to Use** - Yes

---

**Next Steps:**
- Use the Admin Settings page to manage work hours
- API will automatically use these times for calculations
- Update times anytime via the Settings page
