# Work Schedule Configuration Implementation

## Date Implemented: April 20, 2026

## Configuration Applied

**Office Hours:**
- **In Time**: 9:30 AM
- **Out Time**: 4:30 PM
- **Lunch Start**: 12:30 PM
- **Lunch End**: 1:30 PM
- **Auto Checkout**: 4:45 PM

---

## Backend Changes

### 1. Database Schema Updates (`backend/src/models/enhancedModels.ts`)

**CompanySettingsSchema** - Updated defaults:
```typescript
officeStartTime: '09:30'      // 9:30 AM
officeEndTime: '16:30'        // 4:30 PM
lunchStartTime: '12:30'       // 12:30 PM (NEW)
lunchEndTime: '13:30'         // 1:30 PM (NEW)
autoCheckoutTime: '16:45'     // 4:45 PM
```

**AttendanceRecordSchema** - Added fields:
```typescript
lunchStartTime: String        // HH:MM format
lunchEndTime: String          // HH:MM format
```

### 2. Service Layer (`backend/src/services/attendanceSettings.service.ts`)

**Updated Methods:**
- `getSettings()` - Now returns lunch times with defaults (12:30 - 13:30)

**New Method:**
- `updateOfficeHours()` - Saves office hours and lunch times to database
  - Validates time format (HH:MM)
  - Updates CompanySettings document
  - Returns success/error response

### 3. API Endpoints

**New Endpoint:**
- `POST /attendance/settings/office-hours` (Admin only)
  - **Request Body:**
    ```json
    {
      "officeStartTime": "09:30",
      "officeEndTime": "16:30",
      "lunchStartTime": "12:30",
      "lunchEndTime": "13:30"
    }
    ```
  - **Response:**
    ```json
    {
      "success": true,
      "data": {
        "officeStartTime": "09:30",
        "officeEndTime": "16:30",
        "lunchStartTime": "12:30",
        "lunchEndTime": "13:30"
      },
      "message": "Office hours updated successfully"
    }
    ```

**Updated Endpoint:**
- `GET /attendance/settings` (Admin only)
  - Now includes `lunchStartTime` and `lunchEndTime` in response

### 4. Route Handler (`backend/src/routes.ts`)

Added new route at line ~1886:
```typescript
r.post("/attendance/settings/office-hours", authMiddleware, requireAdmin, async (req, res) => {
  // Validates time format (HH:MM)
  // Calls updateOfficeHours service
  // Returns updated settings
})
```

---

## Frontend Changes

### 1. Component State (`frontend/src/pages/AttendanceSettings.tsx`)

**Updated Interface:**
```typescript
interface AttendanceSettings {
  officeStartTime: string;
  officeEndTime: string;
  lunchStartTime: string;      // NEW
  lunchEndTime: string;          // NEW
  attendancePercentageStartDate?: string;
  attendancePercentageEndDate?: string;
  attendanceCalculationMode: string;
  attendanceLastNDays: number;
}
```

**New State Variables:**
```typescript
const [officeStartTime, setOfficeStartTime] = useState("09:30");
const [officeEndTime, setOfficeEndTime] = useState("16:30");
const [lunchStartTime, setLunchStartTime] = useState("12:30");
const [lunchEndTime, setLunchEndTime] = useState("13:30");
```

### 2. Updated Methods

**loadSettings()** - Now loads lunch times:
```typescript
setOfficeStartTime(data.officeStartTime || "09:30");
setOfficeEndTime(data.officeEndTime || "16:30");
setLunchStartTime(data.lunchStartTime || "12:30");
setLunchEndTime(data.lunchEndTime || "13:30");
```

### 3. New Method

**handleSaveOfficeHours()** - Saves office hours via API:
```typescript
const response = await apiJson("/attendance/settings/office-hours", {
  method: "POST",
  body: JSON.stringify({
    officeStartTime,
    officeEndTime,
    lunchStartTime,
    lunchEndTime,
  }),
});
```

### 4. New UI Section

**Office Hours Configuration Card:**
- Added at the top of AttendanceSettings page
- Green header with calendar icon
- 4 time input fields:
  - Office Start Time
  - Office End Time
  - Lunch Start Time
  - Lunch End Time
- Current hours display
- Save button

---

## Files Modified

1. **Backend**
   - `backend/src/models/enhancedModels.ts` - Schema updates
   - `backend/src/services/attendanceSettings.service.ts` - New method + updates
   - `backend/src/controllers/attendanceSettings.controller.ts` - New controller function
   - `backend/src/routes.ts` - New route handler

2. **Frontend**
   - `frontend/src/pages/AttendanceSettings.tsx` - UI + state management

---

## How to Use

### Admin Interface

1. Navigate to **Attendance Settings** page (Admin only)
2. Scroll to **Office Hours Configuration** section
3. Update the time fields:
   - Office Start: `09:30`
   - Office End: `16:30`
   - Lunch Start: `12:30`
   - Lunch End: `13:30`
4. Click **Save Office Hours** button
5. Success notification appears

### Verification

Check settings via API:
```bash
curl http://localhost:4000/api/attendance/settings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response includes:
{
  "officeStartTime": "09:30",
  "officeEndTime": "16:30",
  "lunchStartTime": "12:30",
  "lunchEndTime": "13:30",
  ...
}
```

---

## Database Default Values

When CompanySettings is first created, it uses these defaults:
- **Office Start**: 9:30 AM
- **Office End**: 4:30 PM
- **Lunch Start**: 12:30 PM
- **Lunch End**: 1:30 PM
- **Auto Checkout**: 4:45 PM

---

## Features

✅ Store office hours in database  
✅ Store lunch break times  
✅ Admin can update times via UI  
✅ Lunch times tracked in attendance records  
✅ API validation (HH:MM format)  
✅ Persistent storage (MongoDB)  
✅ Real-time sync with frontend  
✅ Easy to modify for different schedules  

---

## Next Steps (Optional)

1. **Hour Calculation** - Update hour calculation to exclude lunch break
2. **Shift Support** - Add multiple shift configurations
3. **Overtime Tracking** - Track work after office end time
4. **Attendance Report** - Show lunch hours in reports
5. **Mobile Sync** - Send office hours to mobile app

---

## Notes

- Times are stored in 24-hour format (HH:MM)
- All times are validated on both backend and frontend
- Lunch times are optional for attendance records (can be null)
- Settings are global (apply to all employees)
- Admin only - regular employees cannot modify settings
- Changes take effect immediately (no restart needed)

---

**Status**: ✅ Complete  
**Version**: 1.0  
**Last Updated**: April 20, 2026
