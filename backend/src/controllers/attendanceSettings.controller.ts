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
  const normalizedMode = calculationMode === 'last-n-days' ? 'last-n-days' : 'date-range';
  const parsedLastNDays = Number(lastNDays);

  if (normalizedMode === 'date-range') {
    if (!startDate || !endDate) {
      return {
        success: false,
        error: 'Start date and end date are required'
      };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return {
        success: false,
        error: 'Dates must be in YYYY-MM-DD format'
      };
    }

    if (new Date(startDate) > new Date(endDate)) {
      return {
        success: false,
        error: 'Start date must be before end date'
      };
    }
  } else if (!Number.isInteger(parsedLastNDays) || parsedLastNDays < 1 || parsedLastNDays > 365) {
    return {
      success: false,
      error: 'Last N Days must be a whole number between 1 and 365'
    };
  }

  return await settingsService.updateDateRangeSettings(
    normalizedMode === 'date-range' ? startDate : undefined,
    normalizedMode === 'date-range' ? endDate : undefined,
    normalizedMode,
    normalizedMode === 'last-n-days' ? parsedLastNDays : undefined,
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

// Update office hours and lunch time
export const updateOfficeHours = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { officeStartTime, officeEndTime, lunchStartTime, lunchEndTime } = req.body;
  
  // Validate input
  if (!officeStartTime || !officeEndTime || !lunchStartTime || !lunchEndTime) {
    return {
      success: false,
      error: 'All office hours fields are required'
    };
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(officeStartTime) || !timeRegex.test(officeEndTime) || 
      !timeRegex.test(lunchStartTime) || !timeRegex.test(lunchEndTime)) {
    return {
      success: false,
      error: 'Times must be in HH:MM format'
    };
  }

  return await settingsService.updateOfficeHours(
    officeStartTime,
    officeEndTime,
    lunchStartTime,
    lunchEndTime
  );
});
