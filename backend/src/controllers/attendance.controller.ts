import { Request, Response } from 'express';
import { ApiResponse, LocationData, PaginationQuery } from '../types/index.js';
import { AttendanceService } from '../services/attendance.service.js';
import { asyncHandler, authenticateToken } from '../middleware/auth.middleware.js';

const attendanceService = new AttendanceService();

export const checkIn = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { location } = req.body as { location?: LocationData };
  const memberId = req.user?.userId; // Will be set by auth middleware
  
  if (!memberId) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }

  return await attendanceService.checkIn(memberId, location);
});

export const checkOut = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const memberId = req.user?.userId;
  
  if (!memberId) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }

  return await attendanceService.checkOut(memberId);
});

export const getAttendanceHistory = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const memberId = req.user?.userId;
  const query: PaginationQuery = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    sortBy: req.query.sortBy as string || 'date',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
  };
  
  if (!memberId) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }

  return await attendanceService.getAttendanceHistory(memberId, query);
});

export const getPendingApprovals = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  return await attendanceService.getPendingApprovals();
});

export const approveAttendance = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { attendanceId } = req.params;
  const approvedBy = req.user?.userId;
  
  if (!approvedBy) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }

  return await attendanceService.approveAttendance(attendanceId, approvedBy);
});

export const rejectAttendance = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { attendanceId } = req.params;
  const { rejectionReason } = req.body;
  const approvedBy = req.user?.userId;
  
  if (!approvedBy) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }

  return await attendanceService.rejectAttendance(attendanceId, approvedBy, rejectionReason);
});
