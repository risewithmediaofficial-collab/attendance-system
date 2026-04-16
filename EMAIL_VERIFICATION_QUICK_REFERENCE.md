# 🔧 Email Verification - Quick Reference & Code Examples

## ⚡ Quick Start Commands

### 1. Set Environment Variables

Create `.env` in `backend/` folder:

```bash
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=noreply@risewithmedia.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# JWT Secrets
JWT_SECRET=dev-secret-key-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
```

### 2. Start Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 API Testing Examples

### Using cURL

#### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "memberId": "member_001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "data": {
    "userId": "user_1712345678",
    "email": "john@example.com",
    "isEmailVerified": false
  }
}
```

#### Verify Email (After click from email)
```bash
curl "http://localhost:3000/api/auth/verify-email?token=your-raw-token-from-email"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Add Email (Protected)
```bash
curl -X POST http://localhost:3000/api/auth/update-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-access-token" \
  -d '{
    "email": "newemail@example.com"
  }'
```

#### Resend Verification (Protected)
```bash
curl -X POST http://localhost:3000/api/auth/send-verification \
  -H "Authorization: Bearer your-access-token"
```

#### Check Email Status (Protected)
```bash
curl http://localhost:3000/api/auth/check-email-status \
  -H "Authorization: Bearer your-access-token"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_1712345678",
    "hasEmail": true,
    "email": "john@example.com",
    "isEmailVerified": true,
    "message": "Email is set up"
  }
}
```

---

## 💻 Frontend Usage Examples

### React: Check Email Status
```typescript
import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

export function EmailStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await apiJson('/auth/check-email-status');
        if (response.success) {
          setStatus(response.data);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadStatus();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!status?.hasEmail) return <div>No email set</div>;

  return (
    <div>
      {status.isEmailVerified ? (
        <p>✅ {status.email} - Verified</p>
      ) : (
        <p>⚠️ {status.email} - Awaiting Verification</p>
      )}
    </div>
  );
}
```

### React: Add Email
```typescript
const handleAddEmail = async (email: string) => {
  try {
    const response = await apiJson('/auth/update-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (response.success) {
      toast.success('Email added! Please verify in your inbox.');
    } else {
      toast.error(response.error);
    }
  } catch (error) {
    toast.error('Failed to add email');
  }
};
```

### React: Resend Verification
```typescript
const handleResendVerification = async () => {
  try {
    const response = await apiJson('/auth/send-verification', {
      method: 'POST',
    });

    if (response.success) {
      toast.success('Verification email sent!');
    } else {
      toast.error(response.error);
    }
  } catch (error) {
    toast.error('Failed to send verification email');
  }
};
```

### React: Verify Email Page
```typescript
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) return;

      try {
        const response = await apiJson(
          `/auth/verify-email?token=${encodeURIComponent(token)}`
        );

        if (response.success) {
          alert('Email verified! Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          alert(response.error || 'Verification failed');
        }
      } catch (error) {
        alert('Verification error');
      }
    };

    verify();
  }, [token, navigate]);

  return <div>Verifying email...</div>;
}
```

---

## 🔒 Backend Code Examples

### Generate & Hash Token (EmailService)
```typescript
// src/services/email.service.ts

generateToken(): { token: string; hashedToken: string; expiry: number } {
  // Generate secure random 32-byte token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Hash token for database storage
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Set 24-hour expiry
  const expiry = Date.now() + (24 * 60 * 60 * 1000);
  
  return { token, hashedToken, expiry };
}

// Hash incoming token for comparison
hashToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}
```

### Register with Email Verification (Service)
```typescript
// src/services/enhancedAuth.service.ts

async register(userData: {
  username: string;
  email: string;
  password: string;
  memberId: string;
}): Promise<ApiResponse> {
  // Generate token & hash
  const { token, hashedToken, expiry } = this.emailService.generateToken();

  // Hash password
  const passwordHash = await bcrypt.hash(userData.password, 12);

  // Create user with HASHED token in DB
  const user = new User({
    _id: `user_${Date.now()}`,
    ...userData,
    passwordHash,
    emailVerificationToken: hashedToken, // ← Store hashed only!
    emailVerificationExpires: expiry,
    isEmailVerified: false,
  });

  await user.save();

  // Send raw token to user's email
  await this.emailService.sendEmailVerification(userData.email, token); // ← Send raw

  return {
    success: true,
    message: 'Please verify your email',
  };
}
```

### Verify Email (Service)
```typescript
// src/services/enhancedAuth.service.ts

async verifyEmail(token: string): Promise<ApiResponse> {
  // Hash the token from URL
  const hashedToken = this.emailService.hashToken(token);

  // Find user with matching hashed token
  const user = await User.findOne({
    emailVerificationToken: hashedToken, // ← Compare with DB hash
    emailVerificationExpires: { $gt: Date.now() }, // ← Check not expired
  });

  if (!user) {
    return {
      success: false,
      error: 'Invalid or expired verification token',
    };
  }

  // Mark verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return {
    success: true,
    message: 'Email verified successfully',
  };
}
```

### Controller for Send Verification
```typescript
// src/controllers/enhancedAuth.controller.ts

export const sendVerificationEmail = asyncHandler(
  async (req: Request, res: Response): Promise<ApiResponse> => {
    const userId = req.user?.userId;

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    return await authService.sendVerificationEmail(userId);
  }
);
```

### Route Definition
```typescript
// src/routes/enhancedAuth.routes.ts

router.post(
  '/send-verification',
  authenticateToken,
  sendVerificationEmail
);
```

---

## 📧 Email Template Examples

### HTML Email Template
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8"/>
    <style>
      body { font-family: Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; }
      .header { background-color: #3b82f6; color: white; padding: 30px; border-radius: 8px; }
      .content { padding: 30px; }
      .button { 
        background-color: #3b82f6; 
        color: white; 
        padding: 12px 24px; 
        text-decoration: none; 
        border-radius: 6px; 
        display: inline-block;
        font-weight: bold;
      }
      .footer { color: #666; font-size: 12px; text-align: center; padding: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Verify Your Email</h1>
      </div>
      
      <div class="content">
        <p>Welcome to RISE WITH MEDIA!</p>
        <p>Please verify your email to complete registration.</p>
        
        <a href="http://localhost:5173/verify-email?token=xxx" class="button">
          Verify Email
        </a>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          This link expires in 24 hours.<br/>
          If you didn't sign up, ignore this email.
        </p>
      </div>
      
      <div class="footer">
        <p>&copy; 2024 RISE WITH MEDIA. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
```

---

## 🧩 Integration Checklist

- [ ] `.env` file created in backend folder
- [ ] Gmail app password generated and added to `.env`
- [ ] Backend started: `npm run dev`
- [ ] Frontend started: `npm run dev`
- [ ] Database running (MongoDB)
- [ ] Settings page shows email input
- [ ] Can add email
- [ ] Verification email arrives
- [ ] Click link in email
- [ ] Email verified successfully
- [ ] Can resend verification
- [ ] Login requires verified email

---

## 🎯 Common Scenarios

### Scenario 1: New User Registration
```
1. User visits app
2. Clicks "Sign Up"
3. Fills form with email
4. Receives verification email
5. Clicks link in email
6. Redirected to login page ✅
7. Logs in with verified email ✅
```

### Scenario 2: Existing User Adds Email
```
1. Logged in user visits Settings
2. Finds email input field
3. Enters email address
4. Clicks "Add Email"
5. Receives verification email
6. Clicks verification link
7. Email shows as verified ✅
```

### Scenario 3: Resend Verification
```
1. User missed first email
2. Goes to Settings
3. Sees "⚠️ email@example.com - Pending"
4. Clicks "Resend Verification Email"
5. Receives new email
6. Clicks new link
7. Email verified ✅
```

### Scenario 4: Token Expires
```
1. User receives verification email
2. Waits 24+ hours
3. Tries to click verification link
4. Gets "Invalid or expired token" error
5. Must resend verification to get new token
```

---

## 🚨 Error Handling

### Registration Errors
```javascript
// Email already exists
{
  success: false,
  error: "Email already exists"
}

// Username already exists
{
  success: false,
  error: "Username already exists"
}

// Invalid email format
{
  success: false,
  error: "Please provide a valid email address"
}
```

### Verification Errors
```javascript
// Invalid or expired token
{
  success: false,
  error: "Invalid or expired verification token"
}

// No token provided
{
  success: false,
  error: "Verification token is required"
}
```

### Add Email Errors
```javascript
// Email already registered
{
  success: false,
  error: "Email already registered to another account"
}

// No authentication
{
  success: false,
  error: "User not authenticated"
}
```

---

## 📊 Database Queries

### Find unverified emails
```javascript
db.users.find({ isEmailVerified: false })
```

### Find expired tokens
```javascript
db.users.find({ 
  emailVerificationExpires: { 
    $lt: new Date() 
  } 
})
```

### Clean up expired tokens (Admin)
```javascript
db.users.updateMany(
  { emailVerificationExpires: { $lt: new Date() } },
  { 
    $unset: {
      emailVerificationToken: 1,
      emailVerificationExpires: 1
    }
  }
)
```

---

## 🔗 Important Links in Code

| File | Line | Purpose |
|------|------|---------|
| `email.service.ts` | 20-28 | Token generation |
| `email.service.ts` | 30-33 | Token hashing |
| `enhancedAuth.service.ts` | 40-60 | Register with token |
| `enhancedAuth.service.ts` | 65-90 | Verify email |
| `enhancedAuth.service.ts` | 420-460 | Send verification |
| `enhancedAuth.controller.ts` | 110-125 | Send verification endpoint |
| `enhancedAuth.routes.ts` | 32 | Route definition |
| `Settings.tsx` | 50-80 | Email status display |
| `Settings.tsx` | 85-110 | Resend button |

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to strong random string
- [ ] Set FRONTEND_URL to production domain
- [ ] Use HTTPS only (enforce in backend)
- [ ] Enable database backups
- [ ] Set up monitoring for email delivery
- [ ] Test all email flows
- [ ] Configure rate limiting
- [ ] Set up admin dashboard for managing emails
- [ ] Document for team
- [ ] Set up password reset backup if email fails

---

## 📱 Mobile Compatibility

The verification link works on mobile:
```
User clicks link on mobile email app
→ Opens browser
→ Verification page loads
→ Shows success message
→ Redirects to login
✅ Works seamlessly on iOS/Android
```

---

## 🎓 Learning Resources Used

- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [Nodemailer Gmail Setup](https://nodemailer.com/smtp/gmail/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Email Verification](https://cheatsheetseries.owasp.org/cheatsheets/Email_Verification_Cheat_Sheet.html)

---

**Ready to implement? Start with the Gmail setup above! 🚀**
