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
    hours: { type: Number, required: true },
    status: { type: String, required: true },
  },
  { _id: false },
);

const TaskSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    assignedTo: { type: String, required: true },
    deadline: { type: String, required: true },
    priority: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number, required: true },
    completedAt: { type: Number },
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

export const Member = mongoose.model("Member", MemberSchema);
export const User = mongoose.model("User", UserSchema);
export const PendingUser = mongoose.model("PendingUser", PendingUserSchema);
export const AttendanceRecord = mongoose.model("AttendanceRecord", AttendanceRecordSchema);
export const Task = mongoose.model("Task", TaskSchema);
export const Holiday = mongoose.model("Holiday", HolidaySchema);
export const WorkReport = mongoose.model("WorkReport", WorkReportSchema);
export const UserNotification = mongoose.model("UserNotification", UserNotificationSchema);
