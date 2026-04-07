import { Router } from 'express';
import {
  forgotPassword,
  resetPassword
} from '../controllers/passwordReset.controller.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Public routes (no authentication required)
// Rate limited to prevent abuse
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
