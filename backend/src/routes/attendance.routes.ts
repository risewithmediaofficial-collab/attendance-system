import { Router } from 'express';
import { 
  checkIn, 
  checkOut, 
  getAttendanceHistory, 
  getPendingApprovals, 
  approveAttendance, 
  rejectAttendance 
} from '../controllers/attendance.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// All attendance routes require authentication
router.use(authenticateToken);

// Member routes
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.get('/history', getAttendanceHistory);

// Admin/Manager routes
router.get('/pending', authorize(['Admin', 'Manager']), getPendingApprovals);
router.put('/:attendanceId/approve', authorize(['Admin', 'Manager']), approveAttendance);
router.put('/:attendanceId/reject', authorize(['Admin', 'Manager']), rejectAttendance);

export default router;
