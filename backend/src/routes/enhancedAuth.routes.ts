import { Router } from 'express';
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/enhancedAuth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Public routes (no authentication required)
router.post('/register', authLimiter, register);
router.get('/verify-email', verifyEmail);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes (authentication required)
router.post('/change-password', authenticateToken, changePassword);

export default router;
