# QUICK START GUIDE

## Installation Steps

### 1. Install Zod Validation Library

```bash
cd backend
npm install zod
```

### 2. Update Package.json (if needed)

Check that your `backend/package.json` includes:

```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "bcryptjs": "^2.4.3",
    "nodemailer": "^6.9.8",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.10.1",
    "express": "^4.21.2",
    "express-rate-limit": "^7.4.0",
    "node-cron": "^3.0.3",
    "dotenv": "^16.4.7"
  }
}
```

### 3. Environment Variables Setup

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/attendance_db

# JWT Tokens
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_characters_long

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-not-your-regular-password
SMTP_FROM=noreply@risewithmedia.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Server
PORT=4000
NODE_ENV=development

# Optional: CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Gmail App Password (Required for Email)

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click "Security" in left sidebar
3. Enable "2-Step Verification" if not already enabled
4. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
5. Select "Mail" and "Linux" (or your OS)
6. Google will generate a 16-character password
7. Copy this as your `SMTP_PASS`

### 5. Create CompanySettings in Database

The first time the app runs, insert default company settings:

```bash
# Connect to MongoDB and run:
db.companysettings.insertOne({
  _id: "default_settings",
  officeStartTime: "09:00",      // 9:00 AM
  officeEndTime: "18:00",        // 6:00 PM
  lateThreshold: 15,              // 15 minutes grace period
  halfDayThreshold: 4,            // 4 hours minimum
  autoCheckoutTime: "18:30",      // 6:30 PM
  timezone: "Asia/Kolkata",
  weekendDays: ["Saturday", "Sunday"],
  holidays: []
})
```

### 6. Start the Backend

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:4000`

---

## Folder Structure Added

```
backend/src/
├── validators/                     # NEW: Zod validation schemas
│   ├── auth.validator.ts
│   ├── attendance.validator.ts
│   └── index.ts
├── middleware/
│   └── validation.middleware.ts    # NEW: Validation middleware
├── services/
│   ├── enhancedAuth.service.ts     # UPDATED: Email verification
│   └── enhancedAttendance.service.ts # COMPLETE: Attendance logic
└── routes/
    ├── enhancedAuth.routes.ts      # UPDATED: Added validation
    └── enhancedAttendance.routes.ts # UPDATED: Added validation
```

---

## API ENDPOINTS SUMMARY

### Authentication

| Method | Endpoint | auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| GET | `/api/auth/verify-email` | ❌ | Verify email token |
| POST | `/api/auth/login` | ❌ | Login user |
| POST | `/api/auth/forgot-password` | ❌ | Request password reset |
| POST | `/api/auth/reset-password` | ❌ | Reset password with token |
| POST | `/api/auth/change-password` | ✅ | Change password (logged-in) |

### Attendance

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/attendance/check-in` | ✅ | User | Mark attendance check-in |
| POST | `/api/attendance/check-out` | ✅ | User | Mark attendance check-out |
| GET | `/api/attendance/today` | ✅ | User | Get today's attendance |
| GET | `/api/attendance/history` | ✅ | User | Get attendance history |
| POST | `/api/attendance/auto-checkout` | ✅ | Admin | Manual auto-checkout trigger |

---

## Testing Endpoints

### 1. Register User

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser_001",
    "email": "testuser@example.com",
    "password": "TestPass@123",
    "memberId": "member_001"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "data": {
    "userId": "user_1707123456789",
    "email": "testuser@example.com",
    "isEmailVerified": false
  }
}
```

### 2. Login Without Verification (Should Fail)

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass@123"
  }'
```

Expected Response:
```json
{
  "success": false,
  "error": "Please verify your email before logging in"
}
```

### 3. Check Email for Verification Link

Check inbox for email with verification link that looks like:
```
http://localhost:5173/verify-email?token=abc123...
```

### 4. Click Verification Link

The frontend will redirect to:
```
GET http://localhost:4000/api/auth/verify-email?token=abc123...
```

Or manually:
```bash
curl -X GET "http://localhost:4000/api/auth/verify-email?token=YOUR_TOKEN_HERE"
```

Expected Response:
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### 5. Login After Verification

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass@123"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_1707123456789",
      "username": "testuser_001",
      "email": "testuser@example.com",
      "isEmailVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

### 6. Check-In (with Access Token)

```bash
curl -X POST http://localhost:4000/api/attendance/check-in \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "lat": 28.5355,
      "lng": 77.3910,
      "accuracy": 50
    }
  }'
```

Expected Response:
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

---

## Common Issues & Solutions

### Issue: "Verification email sent successfully" but email never arrives

**Solution:**
1. Check spam/promotions folder
2. Verify `SMTP_USER` and `SMTP_PASS` are correct
3. For Gmail, ensure you've created an App Password (not your regular password)
4. Check server logs for email sending errors

### Issue: "Validation failed" response

**Solution:**
1. Check error details in response - it lists which field failed
2. Ensure password meets all requirements (uppercase, lowercase, number, special char)
3. Ensure date format is YYYY-MM-DD
4. Ensure location has valid latitude/longitude

### Issue: "Invalid or expired reset token"

**Solution:**
1. Reset tokens expire in **1 hour** - request new reset link if expired
2. Token can only be used once - after reset, previous token is invalidated
3. Reset link format must be exactly as provided in email

### Issue: Check-in showing "Already checked in today"

**Solution:**
1. User already has a check-in record for today
2. Check attendance history to verify
3. Different user must be used to test multiple check-ins

---

## Frontend Integration Notes

### Verify Email Page

The frontend should have a `/verify-email` page that:

```typescript
// pages/VerifyEmail.tsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Call backend API
      fetch(`/api/auth/verify-email?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Show success message and redirect to login
            window.location.href = '/login?verified=true';
          } else {
            // Show error message
            console.error(data.error);
          }
        });
    }
  }, [token]);

  return <div>Verifying your email...</div>;
}
```

### Reset Password Page

The frontend should have a `/reset-password` page that:

```typescript
// pages/ResetPassword.tsx
import { useSearchParams } from 'react-router-dom';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleReset = async (newPassword: string) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });

    const data = await response.json();
    if (data.success) {
      // Redirect to login
      window.location.href = '/login?reset=success';
    }
  };

  return <form onSubmit={(e) => handleReset(e.target.password.value)}>{/* ... */}</form>;
}
```

### Attendance Check-In Page

```typescript
// pages/Attendance.tsx
const handleCheckIn = async () => {
  const token = localStorage.getItem('accessToken');
  
  // Optional: Get user location
  const location = await new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(pos => {
      resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      });
    });
  });

  const response = await fetch('/api/attendance/check-in', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ location })
  });

  const data = await response.json();
  if (data.success) {
    console.log('Checked in at:', data.data.checkInTime);
  }
};
```

---

## Monitoring & Logging

### Enable Request Logging

In development, server logs all requests:

```
2024-02-07T09:15:30.123Z - POST /api/attendance/check-in
2024-02-07T09:16:45.456Z - GET /api/attendance/today
```

### Monitor Cron Jobs

Check for cron job logs in server console:

```
🔄 Running auto checkout job...
✅ Auto checkout completed
Cron job: Auto-checked out 15 users
```

### Database Indexes

Verify indexes are created in MongoDB:

```bash
# In MongoDB shell
db.users.getIndexes()
db.attendancerecords.getIndexes()
```

Should see indexes on:
- `users`: email, emailVerificationToken, passwordResetToken
- `attendancerecords`: userId + date, status

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique JWT secrets (32+ characters)
- [ ] Enable HTTPS for all endpoints
- [ ] Configure CORS for specific frontend domain
- [ ] Set up proper error logging (not console.log)
- [ ] Configure email alerts for failed jobs
- [ ] Monitor failed login attempts
- [ ] Set database connection pooling appropriately
- [ ] Enable database backups
- [ ] Test email functionality before going live
- [ ] Verify timezone configuration matches office location
- [ ] Document all environment variables
- [ ] Set up automated health checks

