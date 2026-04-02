export type Role = "Admin" | "Employee" | "Intern";

export interface Member {
  id: string;
  name: string;
  role?: Role;
  avatarSeed?: string;
}

export interface User {
  id: string;
  memberId: string;
  username: string;
  password: string;
}

export interface PendingUser {
  id: string;
  name: string;
  username: string;
  password: string;
  role: Role;
  createdAt: number;
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  targetMemberIds: string[];
  targetRole?: Exclude<Role, "Admin">;
  createdAt: number;
  createdBy: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  memberId: string;
  loginTime: string;
  logoutTime: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
  hours: number;
  status: "Full Day" | "Half Day" | "Short";
  approvalStatus?: "Approved" | "Pending" | "Rejected";
  submittedAt?: number;
  submittedBy?: string;
  approvedAt?: number;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface WorkReport {
  id: string;
  date: string;
  memberId: string;
  assigned: string;
  completed: string;
  pending: string;
  delivery: "Done" | "Not Done";
}

export type TaskPriority = "Low" | "Medium" | "High";
export type TaskStatus = "Assigned" | "In Progress" | "Completed";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskReminder {
  id: string;
  date: string;
  time: string;
}

export interface Comment {
  id: string;
  taskId: string;
  memberId: string; // ID of commenter
  text: string;
  createdAt: number;
  updatedAt?: number;
}

export interface TaskMessage {
  id: string;
  taskId: string;
  senderId: string;
  senderRole: Role;
  text: string;
  taskSnapshot?: {
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
  createdAt: number;
  isAdmin?: boolean;
}

export interface DailyStatus {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD format
  completedToday: string; // What they completed
  pendingTasks: string[]; // Pending task IDs
  notes: string; // Additional notes
  submittedAt: number;
}

export interface TaskReview {
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string | string[]; // Support multiple assignees
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  // New fields for ClickUp features
  tags?: string[];
  subtasks?: Subtask[];
  checklist?: ChecklistItem[];
  dependencies?: string[]; // Task IDs this depends on
  project?: string;
  isRecurring?: boolean;
  recurringPattern?: "daily" | "weekly" | "biweekly" | "monthly";
  isFavorite?: boolean;
  timeSpent?: number; // in minutes
  reminders?: TaskReminder[];
  comments?: Comment[];
  messages?: TaskMessage[]; // Task-specific messages/replies
  review?: TaskReview; // Admin review status for completed tasks
}

export interface Holiday {
  id: string;
  date: string;
  reason: string;
}

export interface ActivityLog {
  id: string;
  memberId: string;
  action: string;
  taskId?: string;
  timestamp: number;
  details?: string;
}

export interface AuthState {
  loggedIn: boolean;
  userId: string | null;
  notificationsRead?: Record<string, number>;
}

export function generateId() {
  return crypto.randomUUID();
}

export function calculateHours(login: string, logout: string, lunchStart?: string, lunchEnd?: string): number {
  const [lh, lm] = login.split(":").map(Number);
  const [oh, om] = logout.split(":").map(Number);
  let diff = oh * 60 + om - (lh * 60 + lm);
  
  if (lunchStart && lunchEnd) {
    const [slh, slm] = lunchStart.split(":").map(Number);
    const [elh, elm] = lunchEnd.split(":").map(Number);
    const lunchDiff = elh * 60 + elm - (slh * 60 + slm);
    diff -= lunchDiff;
  }
  
  return Math.max(0, +(diff / 60).toFixed(2));
}

export function getStatus(hours: number): "Full Day" | "Half Day" | "Short" {
  if (hours >= 6) return "Full Day";
  if (hours >= 3) return "Half Day";
  return "Short";
}

export function getDayName(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export function isPastDate(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
  return d.getTime() < today.getTime();
}
