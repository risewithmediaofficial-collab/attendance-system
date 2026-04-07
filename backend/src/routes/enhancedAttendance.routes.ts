import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
  autoCheckout
} from '../controllers/enhancedAttendance.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// All attendance routes require authentication
router.use(authenticateToken);

// User routes
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayAttendance);
router.get('/history', getAttendanceHistory);

// Admin only routes
router.post('/auto-checkout', authorize(['Admin']), autoCheckout);

export default router;
