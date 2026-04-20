import mongoose from "mongoose";

// Enhanced User Schema with email verification
const UserSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    memberId: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Number },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Number },
    lastPasswordReset: { type: Number },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Number },
  },
  { _id: false },
);

// Performance indexes for User
UserSchema.index({ memberId: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ emailVerificationToken: 1 });
UserSchema.index({ passwordResetToken: 1 });

// Enhanced Attendance Schema with server-side timing
const AttendanceRecordSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User' },
    date: { type: String, required: true }, // YYYY-MM-DD format
    checkInTime: { type: String }, // HH:MM format (server time)
    checkOutTime: { type: String }, // HH:MM format (server time)
    lunchStartTime: { type: String }, // HH:MM format (server time)
    lunchEndTime: { type: String }, // HH:MM format (server time)
    workingHours: { type: Number, default: 0 }, // in hours
    status: { 
      type: String, 
      enum: ['Present', 'Late', 'Half-day', 'Absent'],
      default: 'Present'
    },
    checkInLocation: {
      lat: Number,
      lng: Number,
      accuracy: Number
    },
    checkOutLocation: {
      lat: Number,
      lng: Number,
      accuracy: Number
    },
    notes: { type: String },
    approvedBy: { type: String, ref: 'User' },
    approvedAt: { type: Number },
    isAutoCheckout: { type: Boolean, default: false },
  },
  { _id: false },
);

// CRITICAL: Performance indexes for AttendanceRecord
AttendanceRecordSchema.index({ userId: 1, date: -1 }); // User's attendance history
AttendanceRecordSchema.index({ date: -1 }); // Daily attendance reports
AttendanceRecordSchema.index({ status: 1 }); // Status-based reports
AttendanceRecordSchema.index({ emailVerificationToken: 1 }); // Email verification lookup
AttendanceRecordSchema.index({ passwordResetToken: 1 }); // Password reset lookup

// Company Settings Schema for attendance rules
const CompanySettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    officeStartTime: { type: String, default: '09:30' }, // 9:30 AM
    officeEndTime: { type: String, default: '16:30' }, // 4:30 PM
    lunchStartTime: { type: String, default: '12:30' }, // 12:30 PM
    lunchEndTime: { type: String, default: '13:30' }, // 1:30 PM
    lateThreshold: { type: Number, default: 15 }, // 15 minutes grace period
    halfDayThreshold: { type: Number, default: 4 }, // 4 hours minimum
    autoCheckoutTime: { type: String, default: '16:45' }, // Auto checkout at 4:45 PM
    timezone: { type: String, default: 'Asia/Kolkata' },
    weekendDays: { type: [String], default: ['Saturday', 'Sunday'] },
    holidays: [{
      date: String, // YYYY-MM-DD
      name: String,
      type: { type: String, enum: ['National', 'Company', 'Optional'] }
    }],
    // Attendance percentage calculation settings
    attendancePercentageStartDate: { type: String }, // YYYY-MM-DD format
    attendancePercentageEndDate: { type: String }, // YYYY-MM-DD format
    attendanceCalculationMode: { type: String, enum: ['date-range', 'last-n-days'], default: 'date-range' },
    attendanceLastNDays: { type: Number, default: 30 }, // If using last-n-days mode
    presentDaysRequired: { type: Number, default: 1 }, // Minimum days required for calculation
    updatedAt: { type: Number, default: () => Date.now() }
  },
  { _id: false }
);

CompanySettingsSchema.index({ date: 1 });

export const User = mongoose.model("User", UserSchema);
export const AttendanceRecord = mongoose.model("AttendanceRecord", AttendanceRecordSchema);
export const CompanySettings = mongoose.model("CompanySettings", CompanySettingsSchema);
