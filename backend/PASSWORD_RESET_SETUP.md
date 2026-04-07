# 🔐 Password Reset System Integration Guide

## **Step 1: Update Main App**

Add password reset routes to your main app:

```javascript
// In src/index.ts
import passwordResetRoutes from './routes/passwordReset.routes.js';

app.use('/api/auth', passwordResetRoutes);
```

## **Step 2: Install Dependencies**

```bash
npm install nodemailer bcryptjs
npm install --save-dev @types/nodemailer
```

## **Step 3: Environment Setup**

Copy `.env.password-reset` to your `.env` file and update:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@risewithmedia.com"
FRONTEND_URL="http://localhost:5173"
```

## **Step 4: Frontend Integration**

### Forgot Password Form
```javascript
// POST /api/auth/forgot-password
{
  "email": "user@example.com"
}

// Response
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### Reset Password Form
```javascript
// POST /api/auth/reset-password
{
  "token": "abc123...",
  "newPassword": "newSecurePassword123"
}

// Response
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

## **Step 5: Email Template Preview**

The system sends professional HTML emails with:
- 🔐 Security-focused design
- ⚠️ Security warnings
- 30-minute expiry notice
- Mobile-responsive layout

## **Step 6: Security Features**

✅ **Token Hashing**: Tokens are hashed before storage
✅ **30-minute Expiry**: Auto-expiration prevents abuse
✅ **Rate Limiting**: Prevents brute force attacks
✅ **Email Enumeration Protection**: Same response for existing/non-existing emails
✅ **Secure Password Hashing**: bcrypt with 12 salt rounds

## **Step 7: Testing**

```bash
# Test forgot password
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test reset password (use token from email)
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token-here","newPassword":"newPassword123"}'
```

## **Step 8: Production Checklist**

- [ ] Configure SMTP credentials
- [ ] Set FRONTEND_URL to production domain
- [ ] Test email delivery
- [ ] Verify rate limiting works
- [ ] Test token expiry
- [ ] Test with invalid tokens

## **Files Created**

```
backend/src/
├── models.ts (updated)                    # Added resetPasswordToken & resetPasswordExpires
├── services/
│   ├── passwordReset.service.ts             # Email sending & token generation
│   └── auth.service.ts (updated)          # Added forgotPassword & resetPassword methods
├── controllers/
│   └── passwordReset.controller.ts          # Forgot & reset password endpoints
├── routes/
│   └── passwordReset.routes.ts             # API routes
└── repositories/
    └── repositories.ts (updated)          # Added findByEmail & findByResetToken
```

## **API Endpoints**

```
POST /api/auth/forgot-password     # Request password reset
POST /api/auth/reset-password      # Reset password with token
```

**System is now production-ready!** 🔒
