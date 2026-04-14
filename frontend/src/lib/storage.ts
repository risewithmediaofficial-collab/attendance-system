export * from "./storageTypes";
import { localStorageImpl } from "./storageLocal";
import { remoteStorageImpl } from "./storageRemote";
import type { AttendanceRecord } from "./storageTypes";

const raw = import.meta.env.VITE_API_BASE as string | undefined;
export const useApiBackend = typeof raw === "string" && raw.trim().length > 0;

export const storage = useApiBackend ? remoteStorageImpl : localStorageImpl;

function isSunday(dateStr: string): boolean {
  const date = new Date(`${dateStr}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.getDay() === 0;
}

export function isHoliday(dateStr: string): boolean {
  return isSunday(dateStr) || storage.getHolidays().some((h) => h.date === dateStr);
}

export function getHolidayReason(dateStr: string): string | undefined {
  if (isSunday(dateStr)) return "Sunday";
  return storage.getHolidays().find((h) => h.date === dateStr)?.reason;
}

export async function approvePendingAccount(id: string): Promise<void> {
  if (useApiBackend) await remoteStorageImpl.approvePending(id);
}

export async function rejectPendingAccount(id: string): Promise<void> {
  if (useApiBackend) await remoteStorageImpl.rejectPending(id);
}

export async function submitAttendance(data: {
  date: string;
  loginTime: string;
  logoutTime: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
}): Promise<void> {
  return storage.submitAttendance(data);
}

export async function approveAttendance(id: string): Promise<void> {
  return storage.approveAttendance(id);
}

export async function rejectAttendance(id: string, reason: string): Promise<void> {
  return storage.rejectAttendance(id, reason);
}

export async function createAdminAttendance(data: {
  memberId: string;
  date: string;
  loginTime: string;
  logoutTime: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
  status?: AttendanceRecord["status"];
}): Promise<void> {
  return storage.createAdminAttendance(data);
}

export async function updateAdminAttendance(
  id: string,
  data: {
    memberId: string;
    date: string;
    loginTime: string;
    logoutTime: string;
    lunchStartTime?: string;
    lunchEndTime?: string;
    status?: AttendanceRecord["status"];
  },
): Promise<void> {
  return storage.updateAdminAttendance(id, data);
}

export async function deleteAdminAttendance(id: string): Promise<void> {
  return storage.deleteAdminAttendance(id);
}

// ========== NEW TASK FUNCTIONS (ClickUp Features) ==========

export async function updateTask(id: string, updates: Partial<any>): Promise<void> {
  return storage.updateTask(id, updates);
}

export async function addSubtask(taskId: string, title: string): Promise<void> {
  return storage.addSubtask(taskId, title);
}

export async function updateSubtask(taskId: string, subtaskId: string, updates: Partial<any>): Promise<void> {
  return storage.updateSubtask(taskId, subtaskId, updates);
}

export async function deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
  return storage.deleteSubtask(taskId, subtaskId);
}

export async function addChecklistItem(taskId: string, text: string): Promise<void> {
  return storage.addChecklistItem(taskId, text);
}

export async function updateChecklistItem(taskId: string, itemId: string, updates: Partial<any>): Promise<void> {
  return storage.updateChecklistItem(taskId, itemId, updates);
}

export async function deleteChecklistItem(taskId: string, itemId: string): Promise<void> {
  return storage.deleteChecklistItem(taskId, itemId);
}

export async function saveTimeTracking(taskId: string, minutes: number): Promise<void> {
  return storage.saveTimeTracking(taskId, minutes);
}

export async function getActivityFeed(): Promise<any[]> {
  return storage.getActivityFeed();
}

// ========== COMMENT FUNCTIONS ==========

export async function addComment(taskId: string, text: string): Promise<void> {
  return storage.addComment(taskId, text);
}

export async function deleteComment(taskId: string, commentId: string): Promise<void> {
  return storage.deleteComment(taskId, commentId);
}

// ========== MESSAGING FUNCTIONS ==========

export async function sendTaskMessage(taskId: string, text: string, isAdmin?: boolean): Promise<void> {
  return storage.sendTaskMessage(taskId, text, isAdmin);
}

export async function getDailyStatus(memberId: string, date: string): Promise<any> {
  return storage.getDailyStatus(memberId, date);
}

export async function submitDailyStatus(data: {
  memberId: string;
  date: string;
  completedToday: string;
  pendingTasks: string[];
  notes: string;
}): Promise<void> {
  return storage.submitDailyStatus(data);
}

export async function reviewTaskCompletion(
  taskId: string,
  status: "approved" | "rejected",
  rejectionReason?: string
): Promise<void> {
  return storage.reviewTaskCompletion(taskId, status, rejectionReason);
}

export async function getPendingReviews(): Promise<any[]> {
  return storage.getPendingReviews();
}
