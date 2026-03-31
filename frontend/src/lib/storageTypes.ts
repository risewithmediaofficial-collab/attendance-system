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
  hours: number;
  status: "Full Day" | "Half Day" | "Short";
  approvalStatus?: "Approved" | "Pending" | "Rejected";
  submittedAt?: number;
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

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface Holiday {
  id: string;
  date: string;
  reason: string;
}

export interface AuthState {
  loggedIn: boolean;
  userId: string | null;
  notificationsRead?: Record<string, number>;
}

export function generateId() {
  return crypto.randomUUID();
}

export function calculateHours(login: string, logout: string): number {
  const [lh, lm] = login.split(":").map(Number);
  const [oh, om] = logout.split(":").map(Number);
  const diff = oh * 60 + om - (lh * 60 + lm);
  return Math.max(0, +(diff / 60).toFixed(2));
}

export function getStatus(hours: number): "Full Day" | "Half Day" | "Short" {
  if (hours >= 8) return "Full Day";
  if (hours >= 4) return "Half Day";
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
