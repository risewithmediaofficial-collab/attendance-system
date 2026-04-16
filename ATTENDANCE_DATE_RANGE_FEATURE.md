# Attendance Percentage Date Range Feature

## Overview

The Attendance Percentage Date Range feature allows administrators to set a specific date range for calculating attendance percentages for all members. This feature enables better attendance tracking and analysis within customizable time periods.

## Features

✅ **Set Date Range**: Admin can specify start and end dates for attendance calculation  
✅ **Flexible Calculation Modes**: Support for date-range and last-n-days calculation methods  
✅ **Automatic Weekend Exclusion**: Weekends are automatically excluded from calculations  
✅ **Member Dashboard**: View attendance percentages for all members sorted by performance  
✅ **Status Badges**: Visual indicators for attendance levels (Excellent, Good, Average, Poor, Critical)  
✅ **Real-time Updates**: Instant calculation based on existing attendance records  

## Backend Implementation

### Database Schema Update

**File**: `backend/src/models/enhancedModels.ts`

New fields added to `CompanySettingsSchema`:

```typescript
{
  // Attendance percentage calculation settings
  attendancePercentageStartDate: String,      // YYYY-MM-DD format
  attendancePercentageEndDate: String,        // YYYY-MM-DD format
  attendanceCalculationMode: String,          // 'date-range' or 'last-n-days'
  attendanceLastNDays: Number,                // Default: 30 days
  presentDaysRequired: Number,                // Minimum days required for calculation
  updatedAt: Number                           // Timestamp of last update
}
```

### API Endpoints

**Base URL**: `http://localhost:5000/api/attendance`

#### 1. Get Attendance Settings
```
GET /attendance/settings
Authorization: Bearer {token}
Admin Only: Yes

Response:
{
  "officeStartTime": "09:00",
  "officeEndTime": "18:00",
  "attendancePercentageStartDate": "2024-01-01",
  "attendancePercentageEndDate": "2024-02-29",
  "attendanceCalculationMode": "date-range",
  "attendanceLastNDays": 30,
  "presentDaysRequired": 1
}
```

#### 2. Update Attendance Date Range
```
POST /attendance/settings/date-range
Content-Type: application/json
Authorization: Bearer {token}
Admin Only: Yes

Request Body:
{
  "startDate": "2024-01-01",
  "endDate": "2024-02-29",
  "calculationMode": "date-range",     // Optional: 'date-range' or 'last-n-days'
  "lastNDays": 30,                      // Optional: used if calculationMode is 'last-n-days'
  "presentDaysRequired": 1              // Optional: minimum days required
}

Response:
{
  "startDate": "2024-01-01",
  "endDate": "2024-02-29",
  "calculationMode": "date-range",
  "lastNDays": 30,
  "presentDaysRequired": 1,
  "message": "Attendance date range settings updated successfully"
}
```

#### 3. Get Attendance Percentage for a Member
```
GET /attendance/percentage/:memberId
Authorization: Bearer {token}
Admin Only: Yes

Response:
{
  "memberId": "member_123",
  "memberName": "John Doe",
  "startDate": "2024-01-01",
  "endDate": "2024-02-29",
  "presentDays": 45,
  "totalWorkingDays": 50,
  "attendancePercentage": 90.00,
  "status": "Excellent"
}
```

#### 4. Get Attendance Percentage for All Members
```
GET /attendance/percentage
Authorization: Bearer {token}
Admin Only: Yes

Response:
{
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-02-29"
  },
  "members": [
    {
      "memberId": "member_123",
      "memberName": "John Doe",
      "presentDays": 45,
      "totalWorkingDays": 50,
      "attendancePercentage": 90.00,
      "status": "Excellent"
    },
    // ... more members sorted by attendance percentage (descending)
  ],
  "totalMembers": 10
}
```

#### 5. Reset Settings to Default
```
POST /attendance/settings/reset
Authorization: Bearer {token}
Admin Only: Yes

Response:
{
  "message": "Settings reset to default"
}
```

### Service Implementation

**File**: `backend/src/services/attendanceSettings.service.ts`

Key methods:

- `getSettings()`: Retrieves current attendance settings
- `updateDateRangeSettings()`: Updates the date range for calculation
- `calculateAttendancePercentage(memberId)`: Calculates attendance % for a specific member
- `calculateAllMembersAttendancePercentage()`: Calculates attendance % for all members
- `resetSettings()`: Resets settings to defaults

### Calculation Logic

**Attendance Percentage Formula**:
```
Attendance % = (Present Days / Total Working Days) × 100
```

**Counts as Present**:
- Status: "Present"
- Status: "Late"
- Status: "Half-day"

**Do NOT Count**:
- Absent days
- Weekends
- Holidays

**Status Levels**:
- **Excellent**: ≥ 90%
- **Good**: 80-89%
- **Average**: 70-79%
- **Poor**: 60-69%
- **Critical**: < 60%

## Frontend Implementation

### Admin Settings Component

**File**: `frontend/src/pages/AttendanceSettings.tsx`

Features:
- 📅 Date range picker for start and end dates
- 🔄 Toggle between "Date Range" and "Last N Days" calculation modes
- 💾 Save settings with validation
- 👥 View all members' attendance percentages
- 📊 Visual progress bars for attendance percentages
- 🏷️ Status badges with color coding
- 🔄 Reset settings to defaults

### Usage

1. Navigate to **Admin Settings** → **Attendance Settings**
2. Choose calculation mode:
   - **Date Range**: Select start and end dates
   - **Last N Days**: Enter number of days
3. Click **Save Settings**
4. Click **View Members Attendance** to see all members' attendance percentages

## Integration with Existing System

The feature integrates seamlessly with the existing attendance system:

1. **Check-In/Check-Out**: Works with existing check-in/check-out functionality
2. **Status Tracking**: Uses existing attendance status (Present, Late, Half-day, Absent)
3. **Approval System**: Respects the existing attendance approval workflow
4. **Member Data**: Pulls member names and IDs from existing member database

## Configuration

### Environment Variables

No additional environment variables required. The feature uses existing MongoDB connection.

### Default Values

If no settings are configured:
- Calculation Mode: `date-range`
- Last N Days: `30`
- Present Days Required: `1`

## Examples

### Example 1: Set Attendance Range for January-February

**Request**:
```bash
curl -X POST http://localhost:5000/api/attendance/settings/date-range \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-02-29",
    "calculationMode": "date-range"
  }'
```

**Response**:
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-02-29",
  "calculationMode": "date-range",
  "message": "Attendance date range settings updated successfully"
}
```

### Example 2: Get Attendance for All Members

**Request**:
```bash
curl http://localhost:5000/api/attendance/percentage \
  -H "Authorization: Bearer your_token"
```

**Response**:
```json
{
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-02-29"
  },
  "members": [
    {
      "memberId": "emp_001",
      "memberName": "Alice Johnson",
      "presentDays": 48,
      "totalWorkingDays": 50,
      "attendancePercentage": 96.00,
      "status": "Excellent"
    },
    {
      "memberId": "emp_002",
      "memberName": "Bob Smith",
      "presentDays": 40,
      "totalWorkingDays": 50,
      "attendancePercentage": 80.00,
      "status": "Good"
    }
  ],
  "totalMembers": 2
}
```

## Error Handling

### Invalid Date Format

```json
{
  "error": "Dates must be in YYYY-MM-DD format"
}
```

### Start Date After End Date

```json
{
  "error": "Start date must be before end date"
}
```

### No Settings Configured

```json
{
  "error": "Attendance date range not configured. Please set the date range in settings."
}
```

### Unauthorized Access

```json
{
  "error": "User not authenticated" or "Admin access required"
}
```

## Security

- ✅ Admin-only access for settings configuration
- ✅ Date validation to prevent invalid ranges
- ✅ Authentication required for all endpoints
- ✅ No sensitive member data exposed beyond necessary attendance info

## Performance Considerations

- **Indexing**: Database indexes on `userId`, `date`, and `status` fields for fast queries
- **Caching**: Settings are loaded on each request (can be cached in future optimization)
- **Pagination**: Not required as calculation is performed on entire date range

## Future Enhancements

1. **Caching**: Cache calculated percentages with TTL
2. **Batch Operations**: Support bulk attendance adjustments
3. **Reports**: Export attendance reports to CSV/PDF
4. **Alerts**: Automatic notifications for low attendance members
5. **Custom Thresholds**: Allow configurable status thresholds instead of hardcoded values
6. **Holiday Management**: Better holiday management integration
7. **Department Filters**: Calculate attendance by department
8. **Historical Tracking**: Keep history of previous date range configurations

## Troubleshooting

### Attendance percentages showing 0%
- Ensure attendance records exist for the selected date range
- Check that member IDs in attendance records match member database
- Verify that at least one member has "Present", "Late", or "Half-day" status

### Settings not saving
- Verify you have admin role
- Check browser console for detailed error messages
- Ensure both start and end dates are in YYYY-MM-DD format

### Users not seeing updated percentages
- The calculation is real-time
- If viewing in separate tabs, refresh the page
- Check that attendance records are properly approved

## Support

For issues or questions about this feature, please check:
1. API response error messages
2. Browser console for client-side errors
3. Backend server logs for detailed error traces
