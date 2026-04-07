/**
 * Attendance Validation Schemas
 * Provides Zod schemas for attendance request validation
 */

import { z } from 'zod';

/**
 * Check-In Request Validation
 * Validates: optional location data (lat, lng, accuracy)
 */
export const CheckInSchema = z.object({
  location: z
    .object({
      lat: z
        .number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90'),
      
      lng: z
        .number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180'),
      
      accuracy: z
        .number()
        .positive('Accuracy must be a positive number')
        .optional()
    })
    .optional()
});

export type CheckInRequest = z.infer<typeof CheckInSchema>;

/**
 * Check-Out Request Validation
 * Validates: optional location data for check-out
 */
export const CheckOutSchema = z.object({
  location: z
    .object({
      lat: z
        .number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90'),
      
      lng: z
        .number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180'),
      
      accuracy: z
        .number()
        .positive('Accuracy must be a positive number')
        .optional()
    })
    .optional()
});

export type CheckOutRequest = z.infer<typeof CheckOutSchema>;

/**
 * Attendance History Query Validation
 * Validates: startDate, endDate in YYYY-MM-DD format
 */
export const AttendanceHistorySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  
  page: z
    .number()
    .int()
    .positive('Page must be a positive integer')
    .optional()
    .default(1),
  
  limit: z
    .number()
    .int()
    .positive('Limit must be a positive integer')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(10)
}).refine(
  (data: any) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'Start date must be before or equal to end date',
    path: ['endDate']
  }
);

export type AttendanceHistoryRequest = z.infer<typeof AttendanceHistorySchema>;

/**
 * Attendance Record Validation
 * Validates complete attendance record structure for updates
 */
export const AttendanceRecordSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  
  checkInTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Check-in time must be in HH:MM format')
    .optional(),
  
  checkOutTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Check-out time must be in HH:MM format')
    .optional(),
  
  status: z
    .enum(['Present', 'Late', 'Half-day', 'Absent'])
    .optional(),
  
  workingHours: z
    .number()
    .min(0, 'Working hours cannot be negative')
    .max(24, 'Working hours cannot exceed 24')
    .optional(),
  
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
});

export type AttendanceRecordRequest = z.infer<typeof AttendanceRecordSchema>;

/**
 * Company Settings Validation
 * Validates office timings and attendance rules configuration
 */
export const CompanySettingsSchema = z.object({
  officeStartTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Office start time must be in HH:MM format'),
  
  officeEndTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Office end time must be in HH:MM format'),
  
  lateThreshold: z
    .number()
    .int()
    .min(0, 'Late threshold must be non-negative')
    .max(120, 'Late threshold cannot exceed 120 minutes'),
  
  halfDayThreshold: z
    .number()
    .int()
    .min(1, 'Half-day threshold must be at least 1 hour')
    .max(8, 'Half-day threshold cannot exceed 8 hours'),
  
  autoCheckoutTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Auto-checkout time must be in HH:MM format'),
  
  timezone: z
    .string()
    .default('Asia/Kolkata'),
  
  weekendDays: z
    .array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']))
    .default(['Saturday', 'Sunday'])
}).refine(
  (data: any) => data.officeStartTime < data.officeEndTime,
  {
    message: 'Office end time must be after office start time',
    path: ['officeEndTime']
  }
).refine(
  (data: any) => data.officeEndTime < data.autoCheckoutTime,
  {
    message: 'Auto-checkout time must be after office end time',
    path: ['autoCheckoutTime']
  }
);

export type CompanySettingsRequest = z.infer<typeof CompanySettingsSchema>;
