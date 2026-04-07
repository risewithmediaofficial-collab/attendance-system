import { Router } from 'express';
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  checkEmailStatus,
  updateEmail
} from '../controllers/enhancedAuth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import {
  RegisterSchema,
  VerifyEmailSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema
} from '../validators/index.js';

const router = Router();

// Public routes (no authentication required)
router.post('/register', authLimiter, validateBody(RegisterSchema), register);
router.get('/verify-email', validateQuery(VerifyEmailSchema), verifyEmail);
router.post('/login', authLimiter, validateBody(LoginSchema), login);
router.post('/forgot-password', authLimiter, validateBody(ForgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validateBody(ResetPasswordSchema), resetPassword);

// Protected routes (authentication required)
router.post('/change-password', authenticateToken, validateBody(ChangePasswordSchema), changePassword);
router.get('/check-email-status', authenticateToken, checkEmailStatus);
router.post('/update-email', authenticateToken, validateBody(RegisterSchema), updateEmail);

export default router;
