# IMPLEMENTATION GUIDE: Enhanced Features for RISE WITH MEDIA

## Overview

This document provides complete implementation details for the three major feature sets:
1. **Email Verification System**
2. **Password Reset & Change**
3. **Attendance System with Server-Side Timing**

All features follow clean architecture principles: **Controller → Service → Repository**.

---

## 1. EMAIL VERIFICATION SYSTEM

### Database Schema

**User Collection - Email Verification Fields:**

```typescript
{
  _id: String,                          // Unique user ID
  email: String,                        // User's email (unique)
  isEmailVerified: Boolean,             // Verification status
  emailVerificationToken: String,       // One-time verification token
  emailVerificationExpires: Number,     // Token expiry timestamp (24 hours)
  // ... other fields
}
```

### How It Works

#### 1. Registration Flow

**Endpoint:** `POST /api/auth/register`

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "memberId": "member_123"
}
```

**Validation Schema:**
- Username: 3-50 chars, alphanumeric + underscore/dash
- Email: Valid email format
- Password: Min 8 chars, uppercase, lowercase, number, special char
- Member ID: Required, non-empty

**Process:**
1. Validate request using Zod schema
2. Check if email/username already exists
3. Hash password using bcryptjs (12 salt rounds)
4. Generate secure verification token (64-char hex string)
5. Store token with 24-hour expiry in database
6. Send verification email via nodemailer

**Response:**

```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "data": {
    "userId": "user_1707123456789",
    "email": "john@example.com",
    "isEmailVerified": false
  }
}
```

#### 2. Email Verification Flow

**Endpoint:** `GET /api/auth/verify-email?token=<verification_token>`

**Process:**
1. Validate token format and expiry
2. Find user with matching token and non-expired timestamp
3. Mark `isEmailVerified = true`
4. Remove token from database
5. Return success response

**Response:**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Handling:**
- Invalid token: `"Invalid or expired verification token"`
- Expired token: `"Invalid or expired verification token"`
- Token not found: `"Invalid or expired verification token"`

#### 3. Login with Verification Check

**Endpoint:** `POST /api/auth/login`

```json
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

**Process:**
1. Find user by email
2. **CHECK:** If `isEmailVerified === false`, return error message
3. Check account lock status (brute force protection)
4. Verify password against stored hash
5. On invalid password: increment `loginAttempts`, lock after 5 attempts (30 mins)
6. On success: reset login attempts, generate JWT tokens

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_1707123456789",
      "username": "john_doe",
      "email": "john@example.com",
      "isEmailVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

---

## 2. PASSWORD RESET & CHANGE

### Database Schema

**User Collection - Password Reset Fields:**

```typescript
{
  _id: String,
  passwordHash: String,                 // Bcrypt hashed password
  passwordResetToken: String,           // Reset token (one-time)
  passwordResetExpires: Number,         // Expiry timestamp (1 hour)
  lastPasswordReset: Number,            // Timestamp of last password change
  // ... other fields
}
```

### Forgot Password Flow

**Endpoint:** `POST /api/auth/forgot-password`

```json
{
  "email": "john@example.com"
}
```

**Process:**
1. Find user by email (but don't reveal if email exists or not)
2. Generate secure reset token with **1-hour expiry**
3. Hash token using SHA256
4. Store both token and expiry in database
5. Send reset email with token & reset link

**Response (Always Success):**

```json
{
  "success": true,
  "message": "If the email exists, a reset link has been sent"
}
```

**Security Note:** Never reveal whether email exists to prevent account enumeration attacks.

### Reset Password Flow

**Endpoint:** `POST /api/auth/reset-password`

```json
{
  "token": "<reset_token_from_email>",
  "newPassword": "NewSecurePass@456"
}
```

**Validation:**
- Token: Min 64 chars
- New Password: Min 8 chars, uppercase, lowercase, number, special char

**Process:**
1. Find user with matching reset token
2. Validate token hasn't expired
3. Hash new password using bcryptjs (12 salt rounds)
4. Update password in database
5. Clear reset token from database to prevent reuse
6. Record password reset timestamp

**Response:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Handling:**
- Invalid/expired token: `"Invalid or expired reset token"`
- Password validation failed: `"Password must contain uppercase, lowercase, number, and special character"`

### Change Password Flow (Authenticated User)

**Endpoint:** `POST /api/auth/change-password` (requires JWT auth)

```json
{
  "oldPassword": "SecurePass@123",
  "newPassword": "NewSecurePass@456"
}
```

**Authentication:** Must include valid JWT in `Authorization: Bearer <token>` header

**Process:**
1. Verify user is authenticated
2. Fetch user from database using userId from JWT
3. Compare `oldPassword` against stored hash
4. Validate `newPassword` meets requirements
5. Ensure `newPassword !== oldPassword`
6. Hash new password using bcryptjs (12 salt rounds)
7. Update password in database

**Response:**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Handling:**
- Not authenticated: `"User not authenticated"`
- Incorrect old password: `"Current password is incorrect"`
- New password same as old: `"New password must be different from current password"`

---

## 3. ATTENDANCE SYSTEM

### Database Schema

**AttendanceRecord Collection:**

```typescript
{
  _id: String,                          // Unique record ID
  userId: String,                       // Reference to User
  date: String,                         // YYYY-MM-DD format
  checkInTime: String,                  // HH:MM format (server time)
  checkOutTime: String,                 // HH:MM format (server time)
  workingHours: Number,                 // Hours worked (decimal)
  status: Enum,                         // 'Present' | 'Late' | 'Half-day' | 'Absent'
  checkInLocation: {
    lat: Number,
    lng: Number,
    accuracy: Number
  },
  checkOutLocation: {                   // Optional location data
    lat: Number,
    lng: Number,
    accuracy: Number
  },
  notes: String,
  approvedBy: String,                   // Admin user ID
  approvedAt: Number,                   // Approval timestamp
  isAutoCheckout: Boolean,              // True if auto-checked out by cron
}
```

**CompanySettings Collection:**

```typescript
{
  _id: String,
  officeStartTime: String,              // "09:00" (9:00 AM)
  officeEndTime: String,                // "18:00" (6:00 PM)
  lateThreshold: Number,                // 15 minutes grace period
  halfDayThreshold: Number,             // 4 hours minimum
  autoCheckoutTime: String,             // "18:30" (6:30 PM)
  timezone: String,                     // "Asia/Kolkata"
  weekendDays: String[],                // ["Saturday", "Sunday"]
  holidays: [{
    date: String,                       // YYYY-MM-DD
    name: String,
    type: Enum                          // 'National' | 'Company' | 'Optional'
  }]
}
```

### Check-In Flow

**Endpoint:** `POST /api/attendance/check-in` (requires JWT auth)

```json
{
  "location": {
    "lat": 28.5355,
    "lng": 77.3910,
    "accuracy": 50
  }
}
```

**Location is Optional** - If provided:
- Latitude: -90 to 90
- Longitude: -180 to 180
- Accuracy: Positive number (meters)

**Process (SERVER-SIDE TIMING):**

1. **Get current server time** (NOT from frontend)
   ```typescript
   const now = new Date();
   const time = now.toLocaleTimeString('en-US', {
     timeZone: 'Asia/Kolkata',
     hour12: false,
     hour: '2-digit',
     minute: '2-digit'
   });
   // Result: "09:15" (HH:MM format)
   ```

2. Check if user already checked in today
3. Calculate attendance status:
   - If checkInTime ≤ officeStartTime + lateThreshold → **"Present"**
   - If checkInTime > officeStartTime + lateThreshold → **"Late"**
4. Create attendance record with server time
5. Store location if provided

**🔴 CRITICAL:** Times are captured on the server, NOT from the client. This prevents manipulation.

**Response:**

```json
{
  "success": true,
  "message": "Checked in successfully. Status: Present",
  "data": {
    "date": "2024-02-07",
    "checkInTime": "09:15",
    "status": "Present"
  }
}
```

**Error Handling:**
- Already checked in: `"Already checked in today"`
- Invalid location: `"Invalid check-in location"`
- Not authenticated: `"User not authenticated"`

### Check-Out Flow

**Endpoint:** `POST /api/attendance/check-out` (requires JWT auth)

```json
{
  "location": {
    "lat": 28.5355,
    "lng": 77.3910
  }
}
```

**Process:**

1. Find today's attendance record with checkInTime but no checkOutTime
2. Capture current server time for checkout
3. Calculate working hours:
   ```typescript
   const totalMinutes = (checkOutHours * 60 + checkOutMinutes) - 
                        (checkInHours * 60 + checkInMinutes);
   const workingHours = totalMinutes / 60;
   ```
4. Update status if half-day:
   - If workingHours < halfDayThreshold (4 hours) → **"Half-day"**
   - Otherwise → Keep original status
5. Update record with checkout time, working hours, and status

**Response:**

```json
{
  "success": true,
  "message": "Checked out successfully. Working hours: 8.5h",
  "data": {
    "checkOutTime": "17:45",
    "workingHours": 8.5,
    "status": "Present",
    "checkInTime": "09:15"
  }
}
```

**Error Handling:**
- No check-in record found: `"No check-in record found for today"`
- Already checked out: `"Already checked out today"`
- Not authenticated: `"User not authenticated"`

### Get Today's Attendance

**Endpoint:** `GET /api/attendance/today` (requires JWT auth)

**Response:**

```json
{
  "success": true,
  "data": {
    "date": "2024-02-07",
    "checkInTime": "09:15",
    "checkOutTime": "17:45",
    "workingHours": 8.5,
    "status": "Present"
  }
}
```

Or if no record:

```json
{
  "success": true,
  "data": null,
  "message": "No attendance record for today"
}
```

### Get Attendance History

**Endpoint:** `GET /api/attendance/history?startDate=2024-01-01&endDate=2024-02-07&page=1&limit=10`

**Query Parameters:**
- `startDate` (required): YYYY-MM-DD format
- `endDate` (required): YYYY-MM-DD format
- `page` (optional): Integer, default 1
- `limit` (optional): Integer 1-100, default 10

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-02-07",
      "checkInTime": "09:15",
      "checkOutTime": "17:45",
      "workingHours": 8.5,
      "status": "Present"
    },
    {
      "date": "2024-02-06",
      "checkInTime": "09:00",
      "checkOutTime": "13:00",
      "workingHours": 4,
      "status": "Half-day"
    }
  ]
}
```

### Auto-Checkout (Cron Job)

**Triggered:** Daily at 6:30 PM (configured via `autoCheckoutTime`)

**Process:**
1. Find all records for today with checkInTime but no checkOutTime
2. For each record:
   - Set checkOutTime to `autoCheckoutTime`
   - Calculate working hours
   - Update status if half-day
   - Set `isAutoCheckout = true` flag
3. Log how many users were auto-checked out

**Cron Scheduling:**
```typescript
cron.schedule('0 18 * * *', autoCheckoutJob, {
  timezone: 'Asia/Kolkata'
});
```

The job runs at **6:00 PM** (18:00), but records show checkout at **6:30 PM** (18:30).

---

## 4. VALIDATION & SECURITY

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

### Rate Limiting
- Authentication routes: 5 requests per 15 minutes per IP
- Brute force protection: Lock account after 5 failed login attempts for 30 minutes

### Token Management
- **Access Token:** Expires in 15 minutes
- **Refresh Token:** Expires in 7 days
- **Email Verification Token:** Expires in 24 hours
- **Password Reset Token:** Expires in 1 hour

### Bcrypt Configuration
- Salt rounds: 12 (higher = more secure but slower)
- Recommended for production systems

### API Response Format

All endpoints follow consistent response structure:

```typescript
interface ApiResponse<T = any> {
  success: boolean;         // true/false
  data?: T;                // Response payload (if success)
  message?: string;        // User-friendly message
  error?: string;          // Error message (if failed)
}
```

---

## 5. FOLDER STRUCTURE

```
backend/src/
├── controllers/
│   └── enhancedAuth.controller.ts       # Auth request handlers
│   └── enhancedAttendance.controller.ts # Attendance request handlers
├── services/
│   └── enhancedAuth.service.ts          # Auth business logic
│   └── enhancedAttendance.service.ts    # Attendance business logic
│   └── email.service.ts                 # Email sending (nodemailer)
│   └── cron.service.ts                  # Scheduled jobs
├── models/
│   └── enhancedModels.ts                # Mongoose schemas
├── repositories/
│   ├── base.repository.ts               # Base CRUD operations
│   └── repositories.ts                  # Specific repository classes
├── routes/
│   ├── enhancedAuth.routes.ts           # Auth endpoints
│   └── enhancedAttendance.routes.ts     # Attendance endpoints
├── middleware/
│   ├── auth.middleware.ts               # JWT verification
│   ├── validation.middleware.ts         # Zod schema validation
│   └── rateLimit.middleware.ts          # Rate limiting
└── validators/
    ├── auth.validator.ts                # Auth Zod schemas
    ├── attendance.validator.ts          # Attendance Zod schemas
    └── index.ts                         # Validator exports
```

---

## 6. INSTALLATION & SETUP

### Required Dependencies

```bash
npm install zod                          # For validation schemas
```

Existing dependencies used:
- `mongoose`: MongoDB ODM
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT tokens
- `nodemailer`: Email sending
- `node-cron`: Scheduled jobs
- `express-rate-limit`: Rate limiting

### Environment Variables

```env
# Database
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@risewithmedia.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Server Port
PORT=4000
```

### Gmail App Password Setup

1. Enable 2-Factor Authentication on Google Account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate "App Password" for Mail on Linux
4. Use this password in `SMTP_PASS`

---

## 7. USAGE EXAMPLES

### Register User

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass@123",
    "memberId": "member_123"
  }'
```

### Verify Email

```bash
# User clicks link in email or visits:
http://localhost:5173/verify-email?token=<token_from_email>

# Backend verifies at:
GET /api/auth/verify-email?token=<token>
```

### Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass@123"
  }'
```

### Check-In

```bash
curl -X POST http://localhost:4000/api/attendance/check-in \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "lat": 28.5355,
      "lng": 77.3910,
      "accuracy": 50
    }
  }'
```

### Get Attendance History

```bash
curl -X GET "http://localhost:4000/api/attendance/history?startDate=2024-01-01&endDate=2024-02-07" \
  -H "Authorization: Bearer <access_token>"
```

---

## 8. TESTING CHECKLIST

- [ ] User can register with valid credentials
- [ ] Verification email is sent on registration
- [ ] User cannot login before email verification
- [ ] Email verification link works and marks user as verified
- [ ] User can login after verification
- [ ] Password reset email is sent on forgot-password
- [ ] User can reset password using reset link
- [ ] User can change password while logged in
- [ ] User cannot login with old password after reset
- [ ] Check-in captures server time correctly
- [ ] User cannot check-in twice in one day
- [ ] Check-out calculates working hours correctly
- [ ] Status updates to "Late" if check-in is after threshold
- [ ] Status updates to "Half-day" if working hours below threshold
- [ ] Auto-checkout job runs at scheduled time
- [ ] Attendance history returns paginated results
- [ ] Rate limiting prevents brute force attacks
- [ ] Account locks after 5 failed login attempts

---

## 9. TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Emails not sending | Check SMTP credentials, enable Gmail app passwords |
| Verification token expired | Token valid for 24 hours, user must click link within this time |
| Reset token expired | Reset token valid for 1 hour only, request new link if expired |
| Check-in time incorrect | Verify server timezone is set to `Asia/Kolkata` in CompanySettings |
| Password validation failing | Ensure password has uppercase, lowercase, number, and special char |
| JWT token invalid | Access token expires in 15 mins, use refresh token to get new one |

---

## 10. PRODUCTION DEPLOYMENT NOTES

1. **Enforce HTTPS** - All endpoints should use HTTPS
2. **CORS Configuration** - Set `CORS_ORIGIN` to specific frontend URL
3. **Rate Limiting** - Increase rate limits appropriately based on user base
4. **Email Provider** - Consider production-grade email service (SendGrid, Mailgun)
5. **Database Indexes** - Ensure indexes are created for queries:
   - `user: {email: 1, emailVerificationToken: 1}`
   - `attendance: {userId: 1, date: -1}`
6. **Token Secrets** - Use strong, unique secrets from secure environment
7. **Logging** - Implement comprehensive logging for audit trails
8. **Monitoring** - Monitor failed authentication attempts and cron job health

