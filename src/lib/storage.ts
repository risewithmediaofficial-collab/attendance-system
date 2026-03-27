export interface Member {
  id: string;
  name: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  memberId: string;
  loginTime: string; // HH:mm
  logoutTime: string; // HH:mm
  hours: number;
  status: 'Full Day' | 'Half Day' | 'Short';
}

export interface WorkReport {
  id: string;
  date: string;
  memberId: string;
  assigned: string;
  completed: string;
  pending: string;
  delivery: 'Done' | 'Not Done';
}

export interface Holiday {
  id: string;
  date: string;
  reason: string;
}

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  // Auth
  isLoggedIn: () => get<boolean>('auth', false),
  login: () => set('auth', true),
  logout: () => set('auth', false),

  // Members
  getMembers: () => get<Member[]>('members', []),
  setMembers: (m: Member[]) => set('members', m),

  // Attendance
  getAttendance: () => get<AttendanceRecord[]>('attendance', []),
  setAttendance: (a: AttendanceRecord[]) => set('attendance', a),

  // Work Reports
  getWorkReports: () => get<WorkReport[]>('workReports', []),
  setWorkReports: (w: WorkReport[]) => set('workReports', w),

  // Holidays
  getHolidays: () => get<Holiday[]>('holidays', []),
  setHolidays: (h: Holiday[]) => set('holidays', h),
};

export function generateId() {
  return crypto.randomUUID();
}

export function calculateHours(login: string, logout: string): number {
  const [lh, lm] = login.split(':').map(Number);
  const [oh, om] = logout.split(':').map(Number);
  const diff = (oh * 60 + om) - (lh * 60 + lm);
  return Math.max(0, +(diff / 60).toFixed(2));
}

export function getStatus(hours: number): 'Full Day' | 'Half Day' | 'Short' {
  if (hours >= 8) return 'Full Day';
  if (hours >= 4) return 'Half Day';
  return 'Short';
}

export function getDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function isHoliday(dateStr: string): boolean {
  return storage.getHolidays().some(h => h.date === dateStr);
}

export function getHolidayReason(dateStr: string): string | undefined {
  return storage.getHolidays().find(h => h.date === dateStr)?.reason;
}
