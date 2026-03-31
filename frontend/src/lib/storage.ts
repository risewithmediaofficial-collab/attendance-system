export * from "./storageTypes";
import { localStorageImpl } from "./storageLocal";
import { remoteStorageImpl } from "./storageRemote";

const raw = import.meta.env.VITE_API_BASE as string | undefined;
export const useApiBackend = typeof raw === "string" && raw.trim().length > 0;

export const storage = useApiBackend ? remoteStorageImpl : localStorageImpl;

export function isHoliday(dateStr: string): boolean {
  return storage.getHolidays().some((h) => h.date === dateStr);
}

export function getHolidayReason(dateStr: string): string | undefined {
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
