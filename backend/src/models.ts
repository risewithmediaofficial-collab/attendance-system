import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    avatarSeed: { type: String },
  },
  { _id: false },
);

// Performance indexes for Member
MemberSchema.index({ role: 1 });
MemberSchema.index({ name: 1 });

const UserSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    memberId: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, trim: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Number },
    passwordHash: { type: String, required: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Number },
  },
  { _id: false },
);

// Performance indexes for User
UserSchema.index({ memberId: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ emailVerificationToken: 1 });
UserSchema.index({ resetPasswordToken: 1 });

const PendingUserSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true },
    createdAt: { type: Number, required: true },
  },
  { _id: false },
);

const AttendanceRecordSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    date: { type: String, required: true },
    memberId: { type: String, required: true },
    loginTime: { type: String, required: true },
    logoutTime: { type: String, required: true },
    lunchStartTime: { type: String },
    lunchEndTime: { type: String },
    hours: { type: Number, required: true },
    status: { type: String, required: true },
    approvalStatus: { type: String, default: "Pending" },
    submittedAt: { type: Number },
    submittedBy: { type: String },
    approvedAt: { type: Number },
    approvedBy: { type: String },
    rejectionReason: { type: String },
  },
  { _id: false },
);

// CRITICAL: Performance indexes for AttendanceRecord
AttendanceRecordSchema.index({ memberId: 1, date: -1 }); // User's attendance history
AttendanceRecordSchema.index({ date: -1 }); // Daily attendance reports
AttendanceRecordSchema.index({ approvalStatus: 1 }); // Pending approvals
AttendanceRecordSchema.index({ memberId: 1, approvalStatus: 1 }); // User's pending approvals

const TaskSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    assignedTo: { type: [String], required: true }, // Changed to array for multiple assignees
    deadline: { type: String, required: true },
    priority: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number, required: true },
    completedAt: { type: Number },
    completedDate: { type: Number }, // When task was marked complete
    // New ClickUp-like fields
    tags: { type: [String], default: [] },
    subtasks: [{
      _id: { type: String, required: true },
      title: { type: String, required: true },
      completed: { type: Boolean, default: false },
      createdAt: { type: Number, required: true },
    }],
    checklist: [{
      _id: { type: String, required: true },
      text: { type: String, required: true },
      completed: { type: Boolean, default: false },
    }],
    dependencies: { type: [String], default: [] },
    project: { type: String },
    isRecurring: { type: Boolean, default: false },
    recurringPattern: { type: String }, // daily, weekly, biweekly, monthly
    isFavorite: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 }, // in minutes
    reminders: [{
      _id: { type: String, required: true },
      date: { type: String, required: true },
      time: { type: String, required: true },
    }],
    comments: [{
      _id: { type: String, required: true },
      memberId: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Number, required: true },
      updatedAt: { type: Number },
    }],
    // Messaging and review fields
    messages: [{
      _id: { type: String, required: true },
      taskId: { type: String, required: true },
      senderId: { type: String, required: true },
      senderRole: { type: String, required: true },
      text: { type: String, required: true },
      taskSnapshot: {
        title: { type: String },
        status: { type: String },
        priority: { type: String },
      },
      createdAt: { type: Number, required: true },
      isAdmin: { type: Boolean, default: false },
    }],
    review: {
      status: { type: String, enum: ["pending", "approved", "rejected"] },
      rejectionReason: { type: String },
      reviewedBy: { type: String },
      reviewedAt: { type: Number },
    },
  },
  { _id: false },
);

// CRITICAL: Performance indexes for Task
TaskSchema.index({ assignedTo: 1, status: 1 }); // User's tasks by status
TaskSchema.index({ status: 1 }); // Task status reports
TaskSchema.index({ project: 1 }); // Project-based tasks
TaskSchema.index({ deadline: 1 }); // Overdue tasks
TaskSchema.index({ assignedTo: 1, deadline: 1 }); // User's upcoming deadlines
TaskSchema.index({ createdAt: -1 }); // Recent tasks

const DailyStatusSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    memberId: { type: String, required: true },
    date: { type: String, required: true },
    completedToday: { type: String, required: true },
    pendingTasks: { type: [String], default: [] },
    notes: { type: String },
    submittedAt: { type: Number, required: true },
  },
  { _id: false },
);

// Performance indexes for DailyStatus
DailyStatusSchema.index({ memberId: 1, date: -1 }); // User's daily status history
DailyStatusSchema.index({ date: -1 }); // Daily status reports

const HolidaySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    date: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { _id: false },
);

// Performance indexes for Holiday
HolidaySchema.index({ date: 1 }); // Holiday lookup

const WorkReportSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    date: { type: String, required: true },
    memberId: { type: String, required: true },
    assigned: { type: String, required: true },
    completed: { type: String, required: true },
    pending: { type: String, required: true },
    delivery: { type: String, required: true },
  },
  { _id: false },
);

// Performance indexes for WorkReport
WorkReportSchema.index({ memberId: 1, date: -1 }); // User's work reports
WorkReportSchema.index({ date: -1 }); // Daily work reports

const UserNotificationSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetMemberIds: { type: [String], default: [] },
    targetRole: { type: String },
    createdAt: { type: Number, required: true },
    createdBy: { type: String, required: true },
  },
  { _id: false },
);

// Performance indexes for UserNotification
UserNotificationSchema.index({ targetMemberIds: 1, createdAt: -1 }); // User's notifications
UserNotificationSchema.index({ targetRole: 1 }); // Role-based notifications
UserNotificationSchema.index({ createdAt: -1 }); // Recent notifications

const ActivityLogSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    memberId: { type: String, required: true },
    action: { type: String, required: true },
    taskId: { type: String },
    timestamp: { type: Number, required: true },
    details: { type: String },
  },
  { _id: false },
);

// Performance indexes for ActivityLog
ActivityLogSchema.index({ memberId: 1, timestamp: -1 }); // User's activity history
ActivityLogSchema.index({ action: 1, timestamp: -1 }); // Action-based reports
ActivityLogSchema.index({ timestamp: -1 }); // Recent activities

export const Member = mongoose.model("Member", MemberSchema);
export const User = mongoose.model("User", UserSchema);
export const PendingUser = mongoose.model("PendingUser", PendingUserSchema);
export const AttendanceRecord = mongoose.model("AttendanceRecord", AttendanceRecordSchema);
export const Task = mongoose.model("Task", TaskSchema);
export const DailyStatus = mongoose.model("DailyStatus", DailyStatusSchema);
export const Holiday = mongoose.model("Holiday", HolidaySchema);
export const WorkReport = mongoose.model("WorkReport", WorkReportSchema);
export const UserNotification = mongoose.model("UserNotification", UserNotificationSchema);
export const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);
