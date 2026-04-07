import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import { EnhancedAttendanceService } from '../services/enhancedAttendance.service.js';
import { asyncHandler, authenticateToken } from '../middleware/auth.middleware.js';

const attendanceService = new EnhancedAttendanceService();

// Check-in
export const checkIn = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const userId = req.user?.userId;
  const { location } = req.body;
  
  if (!userId) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }
  
  return await attendanceService.checkIn(userId, location);
});

// Check-out
export const checkOut = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const userId = req.user?.userId;
  const { location } = req.body;
  
  if (!userId) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }
  
  return await attendanceService.checkOut(userId, location);
});

// Get today's attendance
export const getTodayAttendance = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const userId = req.user?.userId;
  
  if (!userId) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }
  
  return await attendanceService.getTodayAttendance(userId);
});

// Get attendance history
export const getAttendanceHistory = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const userId = req.user?.userId;
  const { startDate, endDate } = req.query;
  
  if (!userId) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }
  
  if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
    return {
      success: false,
      error: 'Start date and end date are required'
    };
  }
  
  return await attendanceService.getAttendanceHistory(userId, startDate, endDate);
});

// Auto-checkout (admin only)
export const autoCheckout = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  return await attendanceService.autoCheckoutUsers();
});
