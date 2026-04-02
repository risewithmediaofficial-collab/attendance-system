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

const UserSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    memberId: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { _id: false },
);

const PendingUserSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
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

const HolidaySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    date: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { _id: false },
);

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
