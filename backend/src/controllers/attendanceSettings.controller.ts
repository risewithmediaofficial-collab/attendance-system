import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import { AttendanceSettingsService } from '../services/attendanceSettings.service.js';
import { asyncHandler, authenticateToken } from '../middleware/auth.middleware.js';

const settingsService = new AttendanceSettingsService();

// Get attendance settings
export const getAttendanceSettings = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  return await settingsService.getSettings();
});

// Update attendance date range settings
export const updateAttendanceDateRange = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { startDate, endDate, calculationMode, lastNDays, presentDaysRequired } = req.body;
  
  // Validate input
  if (!startDate || !endDate) {
    return {
      success: false,
      error: 'Start date and end date are required'
    };
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return {
      success: false,
      error: 'Dates must be in YYYY-MM-DD format'
    };
  }

  // Validate that start date is before end date
  if (new Date(startDate) > new Date(endDate)) {
    return {
      success: false,
      error: 'Start date must be before end date'
    };
  }

  return await settingsService.updateDateRangeSettings(
    startDate,
    endDate,
    calculationMode,
    lastNDays,
    presentDaysRequired
  );
});

// Get attendance percentage for a member within the set date range
export const getAttendancePercentage = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { memberId } = req.params;
  
  if (!memberId) {
    return {
      success: false,
      error: 'Member ID is required'
    };
  }

  return await settingsService.calculateAttendancePercentage(memberId);
});

// Get attendance percentage for all members
export const getAllMembersAttendancePercentage = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  return await settingsService.calculateAllMembersAttendancePercentage();
});

// Reset attendance settings to default
export const resetAttendanceSettings = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  return await settingsService.resetSettings();
});
