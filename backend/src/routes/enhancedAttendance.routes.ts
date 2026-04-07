import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
  autoCheckout
} from '../controllers/enhancedAttendance.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import {
  CheckInSchema,
  CheckOutSchema,
  AttendanceHistorySchema
} from '../validators/index.js';

const router = Router();

// All attendance routes require authentication
router.use(authenticateToken);

// User routes
router.post('/check-in', validateBody(CheckInSchema), checkIn);
router.post('/check-out', validateBody(CheckOutSchema), checkOut);
router.get('/today', getTodayAttendance);
router.get('/history', validateQuery(AttendanceHistorySchema), getAttendanceHistory);

// Admin only routes
router.post('/auto-checkout', authorize(['Admin']), autoCheckout);

export default router;
