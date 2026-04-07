# API REFERENCE - Complete Endpoints Documentation

## Base URL

```
http://localhost:4000/api
```

## Authentication

All protected routes require:

```
Authorization: Bearer <access_token>
```

---

## AUTHENTICATION ENDPOINTS

### 1. Register User

**POST** `/auth/register`

Create a new user account. An email verification will be sent.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "memberId": "member_12345"
}
```

**Validation Rules:**
- `username`: 3-50 chars, alphanumeric with `_` and `-`
- `email`: Valid email format
- `password`: Min 8 chars + uppercase + lowercase + number + special char
- `memberId`: Required, non-empty

**Success Response (200):**
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

**Error Responses:**
```json
{
  "success": false,
  "error": "Email already exists"
}
```

```json
{
  "success": false,
  "error": "Validation failed",
  "data": {
    "errors": [
      { "field": "password", "message": "Password must contain uppercase, lowercase, number, and special character" }
    ]
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

---

### 2. Verify Email

**GET** `/auth/verify-email?token=<verification_token>`

Verify user's email address using token from email link.

**Query Parameters:**
- `token` (required): Token from email verification link

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Invalid or expired verification token"
}
```

**Note:** Token expires after 24 hours.

---

### 3. Login

**POST** `/auth/login`

Authenticate user and receive access/refresh tokens.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

**Validation Rules:**
- `email`: Valid email format
- `password`: Non-empty

**Success Response (200):**
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
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3MDcxMjM0NTY3ODkiLCJ1c2VybmFtZSI6ImpvaG5fZG9lIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDcxMjM0NTZ9.KxN...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3MDcxMjM0NTY3ODkiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwNzEyMzQ1Nn0.5tC...",
    "expiresIn": 900
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

```json
{
  "success": false,
  "error": "Please verify your email before logging in"
}
```

```json
{
  "success": false,
  "error": "Account temporarily locked. Try again later."
}
```

**Rate Limit:** 5 requests per 15 minutes  
**Brute Force Protection:** Locks after 5 failed attempts for 30 minutes

---

### 4. Forgot Password

**POST** `/auth/forgot-password`

Request password reset link via email.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Validation Rules:**
- `email`: Valid email format

**Response (always success for security):**
```json
{
  "success": true,
  "message": "If the email exists, a reset link has been sent"
}
```

**Note:** Returns success regardless of whether email exists (prevents account enumeration).

**Rate Limit:** 5 requests per 15 minutes

---

### 5. Reset Password

**POST** `/auth/reset-password`

Reset password using token from email.

**Request:**
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "newPassword": "NewSecurePass@456"
}
```

**Validation Rules:**
- `token`: Min 64 chars
- `newPassword`: Min 8 chars + uppercase + lowercase + number + special char

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

```json
{
  "success": false,
  "error": "Validation failed",
  "data": {
    "errors": [
      { "field": "newPassword", "message": "Password must contain uppercase, lowercase, number, and special character" }
    ]
  }
}
```

**Note:** Token expires after 1 hour and becomes invalid after use.

**Rate Limit:** 5 requests per 15 minutes

---

### 6. Change Password

**POST** `/auth/change-password`

Change password for logged-in user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "oldPassword": "SecurePass@123",
  "newPassword": "NewSecurePass@456"
}
```

**Validation Rules:**
- `oldPassword`: Non-empty, must match current password
- `newPassword`: Min 8 chars + uppercase + lowercase + number + special char + different from old

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

```json
{
  "success": false,
  "error": "User not authenticated"
}
```

**Authentication Required:** ✅

---

## ATTENDANCE ENDPOINTS

### 1. Check-In

**POST** `/attendance/check-in`

Mark attendance check-in. Server captures current time automatically.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "location": {
    "lat": 28.5355,
    "lng": 77.3910,
    "accuracy": 50
  }
}
```

**Validation Rules:**
- `location` (optional):
  - `lat`: -90 to 90
  - `lng`: -180 to 180
  - `accuracy`: Positive number

**Success Response (200):**
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

**Error Responses:**
```json
{
  "success": false,
  "error": "Already checked in today"
}
```

```json
{
  "success": false,
  "error": "User not authenticated"
}
```

**Status Determination:**
- **Present**: Check-in ≤ (officeStartTime + lateThreshold = 9:15)
- **Late**: Check-in > (officeStartTime + lateThreshold)

**Authentication Required:** ✅

---

### 2. Check-Out

**POST** `/attendance/check-out`

Mark attendance check-out. Calculates working hours automatically.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "location": {
    "lat": 28.5355,
    "lng": 77.3910,
    "accuracy": 50
  }
}
```

**Validation Rules:**
- `location` (optional): Same as check-in

**Success Response (200):**
```json
{
  "success": true,
  "message": "Checked out successfully. Working hours: 8.5h",
  "data": {
    "date": "2024-02-07",
    "checkInTime": "09:15",
    "checkOutTime": "17:45",
    "workingHours": 8.5,
    "status": "Present"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "No check-in record found for today"
}
```

```json
{
  "success": false,
  "error": "Already checked out today"
}
```

**Status Update Logic:**
- If workingHours < halfDayThreshold (4 hours) → Status = "Half-day"
- Otherwise → Keeps original status

**Authentication Required:** ✅

---

### 3. Get Today's Attendance

**GET** `/attendance/today`

Retrieve today's attendance record.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response - With Check-In (200):**
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

**Success Response - No Record (200):**
```json
{
  "success": true,
  "data": null,
  "message": "No attendance record for today"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "User not authenticated"
}
```

**Authentication Required:** ✅

---

### 4. Get Attendance History

**GET** `/attendance/history?startDate=2024-01-01&endDate=2024-02-07&page=1&limit=10`

Retrieve historical attendance records with pagination.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Param | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `startDate` | string | ✅ | - | YYYY-MM-DD format |
| `endDate` | string | ✅ | - | YYYY-MM-DD format |
| `page` | integer | ❌ | 1 | Positive integer |
| `limit` | integer | ❌ | 10 | 1-100 |

**Validation Rules:**
- `startDate`: YYYY-MM-DD format, must be ≤ endDate
- `endDate`: YYYY-MM-DD format, must be ≥ startDate
- `page`: Positive integer
- `limit`: Positive integer, max 100

**Success Response (200):**
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
    },
    {
      "date": "2024-02-05",
      "checkInTime": "09:30",
      "checkOutTime": "18:00",
      "workingHours": 8.5,
      "status": "Late"
    }
  ]
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Validation failed",
  "data": {
    "errors": [
      { "field": "startDate", "message": "Start date must be in YYYY-MM-DD format" }
    ]
  }
}
```

```json
{
  "success": false,
  "error": "User not authenticated"
}
```

**Authentication Required:** ✅

---

### 5. Auto-Checkout (Admin Only)

**POST** `/attendance/auto-checkout`

Manually trigger auto-checkout for users who haven't checked out.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:** Empty body (or {})

**Success Response (200):**
```json
{
  "success": true,
  "message": "Auto-checked out 12 users",
  "data": {
    "autoCheckedOut": 12
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Access denied. Admin role required."
}
```

**Automatic Trigger:** Runs daily via cron job at 6:00 PM
- Checks all records with checkInTime but no checkOutTime
- Sets checkout to `autoCheckoutTime` (18:30)
- Updates status to "Half-day" if working hours < threshold
- Sets `isAutoCheckout: true` flag

**Authentication Required:** ✅ (Admin only)

---

## ERROR HANDLING

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Validation Error Response

```json
{
  "success": false,
  "error": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must contain uppercase, lowercase, number, and special character"
      }
    ]
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Successful request |
| 400 | Bad Request | Invalid input/validation failed |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Not authorized (e.g., not admin) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

---

## AUTHENTICATION FLOW

### Token Lifecycle

```
┌─────────────────────────────────────────┐
│     User Registration & Verification     │
├─────────────────────────────────────────┤
│ 1. POST /auth/register                  │
│    → Email verification sent            │
│ 2. GET /verify-email?token=...          │
│    → User verified                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          User Login                      │
├─────────────────────────────────────────┤
│ 3. POST /auth/login                     │
│    ← accessToken (15 min)               │
│    ← refreshToken (7 days)              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Make Protected API Calls            │
├─────────────────────────────────────────┤
│ Headers: Authorization: Bearer <token>  │
│ 4. POST /attendance/check-in            │
│ 5. POST /attendance/check-out           │
│ 6. GET /attendance/today                │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Token Refresh (if expired)          │
├─────────────────────────────────────────┤
│ accessToken expired? (15 min)           │
│ 7. Use /auth/refresh-token endpoint     │
│    ← New accessToken                    │
│ Valid for another 15 minutes            │
└─────────────────────────────────────────┘
```

---

## EXAMPLES BY USE CASE

### Use Case: New Employee Registration

```bash
# Step 1: Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alex_smith",
    "email": "alex@company.com",
    "password": "CompanyPass123!",
    "memberId": "emp_001"
  }'

# Wait - Email verification link sent to alex@company.com

# Step 2: Click verification link in email
# OR manually call:
curl -X GET "http://localhost:4000/api/auth/verify-email?token=<token_from_email>"

# Step 3: Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@company.com",
    "password": "CompanyPass123!"
  }'

# Response contains: accessToken, refreshToken
```

### Use Case: Employee Check-In

```bash
# Get access token from login response
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Check-in at 9:15 AM
curl -X POST http://localhost:4000/api/attendance/check-in \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "lat": 28.5355,
      "lng": 77.3910
    }
  }'

# Response: Status = "Present" (on time)
```

### Use Case: Password Reset Flow

```bash
# Step 1: Request password reset
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "alex@company.com"}'

# Wait - Email with reset link sent

# Step 2: Click reset link in email
# OR manually call:
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<token_from_email>",
    "newPassword": "NewPass456!"
  }'

# Step 3: Login with new password
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@company.com",
    "password": "NewPass456!"
  }'
```

---

## RATE LIMITING

### Limits Applied

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/register` | 5 | 15 minutes |
| `/auth/login` | 5 | 15 minutes |
| `/auth/forgot-password` | 5 | 15 minutes |
| `/auth/reset-password` | 5 | 15 minutes |

### Rate Limit Headers

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1707210300
```

### Rate Limit Exceeded Response

```json
HTTP 429 Too Many Requests

{
  "success": false,
  "error": "Too many attempts, please try again later"
}
```

---

## PAGINATION

### Pagination Parameters

```
GET /api/attendance/history?startDate=2024-01-01&endDate=2024-02-07&page=2&limit=20
```

### Pagination Response

```json
{
  "success": true,
  "data": [
    { /* attendance record 1 */ },
    { /* attendance record 2 */ }
  ],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## TESTING WITH POSTMAN

### Setup Postman Collection

1. Create new Collection: "RISE WITH MEDIA API"
2. Create Environment with variables:
   ```
   {{base_url}} = http://localhost:4000/api
   {{accessToken}} = [leave empty, fill after login]
   {{email}} = test@example.com
   {{password}} = SecurePass@123
   ```

3. Create Requests:
   - **Register**: POST `/{{base_url}}/auth/register`
   - **Login**: POST `/{{base_url}}/auth/login`
   - **Check-In**: POST `/{{base_url}}/attendance/check-in` with Auth header
   - **Check-Out**: POST `/{{base_url}}/attendance/check-out` with Auth header

4. In Login request, add Test script:
   ```javascript
   if (pm.response.code === 200) {
     var jsonData = pm.response.json();
     pm.environment.set("accessToken", jsonData.data.accessToken);
   }
   ```

