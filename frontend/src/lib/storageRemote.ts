import { apiFetch, apiJson, clearSession, getStoredUserId, getToken, setSession } from "./api";
import type {
  AttendanceRecord,
  AuthState,
  Holiday,
  Member,
  PendingUser,
  Role,
  Task,
  User,
  UserNotification,
  WorkReport,
} from "./storageTypes";
import { isPastDate } from "./storageTypes";

const NOTIF_READ_KEY = "mt_notif_read";

interface BootstrapData {
  members: Member[];
  users: User[];
  pendingUsers: PendingUser[];
  attendance: AttendanceRecord[];
  tasks: Task[];
  holidays: Holiday[];
  reports: WorkReport[];
  userNotifications: UserNotification[];
}

type Cache = {
  members: Member[];
  users: User[];
  pendingUsers: PendingUser[];
  attendance: AttendanceRecord[];
  tasks: Task[];
  holidays: Holiday[];
  reports: WorkReport[];
  userNotifications: UserNotification[];
  auth: AuthState;
};

let cache: Cache | null = null;

function readNotifRead(): Record<string, number> {
  try {
    const raw = localStorage.getItem(NOTIF_READ_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function applyBootstrap(data: BootstrapData, userId: string | null): void {
  cache = {
    members: data.members,
    users: data.users.map((u) => ({ ...u, password: u.password ?? "" })),
    pendingUsers: data.pendingUsers,
    attendance: data.attendance,
    tasks: data.tasks,
    holidays: data.holidays,
    reports: data.reports,
    userNotifications: data.userNotifications,
    auth: { loggedIn: !!userId, userId },
  };
}

async function putJson(path: string, body: unknown): Promise<void> {
  const r = await apiFetch(path, { method: "PUT", body: JSON.stringify(body) });
  if (!r.ok) {
    console.error("Sync failed", path, await r.text());
  }
}

function memberRole(member: Member | undefined): Role {
  return member?.role ?? "Intern";
}

export const remoteStorageImpl = {
  getAuth: (): AuthState => ({
    loggedIn: !!getToken() && !!cache?.auth.loggedIn,
    userId: getStoredUserId(),
    notificationsRead: readNotifRead(),
  }),

  isLoggedIn: (): boolean => !!getToken() && !!cache?.auth.loggedIn,

  login: async (username: string, password: string): Promise<boolean> => {
    let r: Response;
    try {
      r = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
    } catch {
      throw new Error("Cannot reach the login server. Start both apps using `npm run dev:stack`.");
    }
    if (r.status === 401) return false;
    if (!r.ok) {
      let message = "Login failed. Please try again.";
      try {
        const body = (await r.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    const j = (await r.json()) as { token: string; user: { id: string } };
    setSession(j.token, j.user.id);
    const data = await apiJson<BootstrapData>("/bootstrap");
    applyBootstrap(data, j.user.id);
    return true;
  },

  logout: () => {
    clearSession();
    cache = null;
  },

  hydrate: async (): Promise<void> => {
    const userId = getStoredUserId();
    if (!userId) {
      cache = null;
      return;
    }
    const data = await apiJson<BootstrapData>("/bootstrap");
    applyBootstrap(data, userId);
  },

  getUsers: (): User[] => cache?.users ?? [],
  setUsers: (u: User[]) => {
    if (!cache) return;
    cache.users = u;
    void putJson("/users", u);
  },

  getPendingUsers: (): PendingUser[] => cache?.pendingUsers ?? [],
  setPendingUsers: (p: PendingUser[]) => {
    if (!cache) return;
    cache.pendingUsers = p;
  },

  getUserNotifications: (): UserNotification[] => cache?.userNotifications ?? [],
  setUserNotifications: (n: UserNotification[]) => {
    if (!cache) return;
    cache.userNotifications = n;
    void putJson("/notifications", n);
  },

  getMembers: (): Member[] => cache?.members ?? [],
  setMembers: (m: Member[]) => {
    if (!cache) return;
    cache.members = m;
    void putJson("/members", m);
  },

  getCurrentUserId: (): string | null => getStoredUserId(),
  getCurrentMember: (): Member | null => {
    const userId = getStoredUserId();
    if (!userId || !cache) return null;
    const user = cache.users.find((u) => u.id === userId);
    if (!user) return null;
    return cache.members.find((mem) => mem.id === user.memberId) ?? null;
  },
  getCurrentRole: (): Role => memberRole(remoteStorageImpl.getCurrentMember() ?? undefined),
  isAdmin: () => remoteStorageImpl.getCurrentRole() === "Admin",
  isIntern: () => remoteStorageImpl.getCurrentRole() === "Intern",

  markNotificationRead: (key: string) => {
    const next = { ...readNotifRead(), [key]: Date.now() };
    localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(next));
  },

  canEditAttendanceDate: (dateStr: string): boolean => {
    const role = remoteStorageImpl.getCurrentRole();
    if (role === "Admin") return true;
    if (role === "Intern") return !isPastDate(dateStr);
    return true;
  },

  canEditReportDate: (dateStr: string): boolean => {
    const role = remoteStorageImpl.getCurrentRole();
    if (role === "Admin") return true;
    if (role === "Intern") return !isPastDate(dateStr);
    return true;
  },

  getAttendance: (): AttendanceRecord[] => cache?.attendance ?? [],
  setAttendance: (a: AttendanceRecord[]) => {
    if (!cache) return;
    cache.attendance = a;
    void putJson("/attendance", a);
  },

  getTasks: (): Task[] => cache?.tasks ?? [],
  setTasks: (t: Task[]) => {
    if (!cache) return;
    cache.tasks = t;
    void putJson("/tasks", t);
  },

  getReports: (): WorkReport[] => cache?.reports ?? [],
  setReports: (r: WorkReport[]) => {
    if (!cache) return;
    cache.reports = r;
    void putJson("/reports", r);
  },

  getWorkReports: (): WorkReport[] => cache?.reports ?? [],
  setWorkReports: (w: WorkReport[]) => {
    if (!cache) return;
    cache.reports = w;
    void putJson("/reports", w);
  },

  getHolidays: (): Holiday[] => cache?.holidays ?? [],
  setHolidays: (h: Holiday[]) => {
    if (!cache) return;
    cache.holidays = h;
    void putJson("/holidays", h);
  },

  async approvePending(id: string): Promise<void> {
    const data = await apiJson<BootstrapData>(`/pending/${id}/approve`, { method: "POST" });
    applyBootstrap(data, getStoredUserId());
  },

  async rejectPending(id: string): Promise<void> {
    await apiJson(`/pending/${id}`, { method: "DELETE" });
    const userId = getStoredUserId();
    if (!userId) return;
    const data = await apiJson<BootstrapData>("/bootstrap");
    applyBootstrap(data, userId);
  },

  async submitAttendance(data: {
    date: string;
    loginTime: string;
    logoutTime: string;
    lunchStartTime?: string;
    lunchEndTime?: string;
  }): Promise<void> {
    const response = await apiJson<BootstrapData>("/attendance/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
    applyBootstrap(response, getStoredUserId());
  },

  async approveAttendance(id: string): Promise<void> {
    const data = await apiJson<BootstrapData>(`/attendance/${id}/approve`, { method: "POST" });
    applyBootstrap(data, getStoredUserId());
  },

  async rejectAttendance(id: string, reason: string): Promise<void> {
    const data = await apiJson<BootstrapData>(`/attendance/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    applyBootstrap(data, getStoredUserId());
  },

  // ========== NEW TASK METHODS (ClickUp Features) ==========

  async updateTask(id: string, updates: Partial<any>): Promise<void> {
    const data = await apiJson<BootstrapData>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    applyBootstrap(data, getStoredUserId());
  },

  async addSubtask(taskId: string, title: string): Promise<void> {
    const data = await apiJson<BootstrapData>(`/tasks/${taskId}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    applyBootstrap(data, getStoredUserId());
  },

  async updateSubtask(taskId: string, subtaskId: string, updates: Partial<any>): Promise<void> {
    const data = await apiJson<BootstrapData>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    applyBootstrap(data, getStoredUserId());
  },

  async deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
    const data = await apiJson<BootstrapData>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: "DELETE",
    });
    applyBootstrap(data, getStoredUserId());
  },

  async addChecklistItem(taskId: string, text: string): Promise<void> {
    const data = await apiJson<BootstrapData>(`/tasks/${taskId}/checklist`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    applyBootstrap(data, getStoredUserId());
  },

  async updateChecklistItem(taskId: string, itemId: string, updates: Partial<any>): Promise<void> {
    const data = await apiJson<BootstrapData>(`/tasks/${taskId}/checklist/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    applyBootstrap(data, getStoredUserId());
  },

  async deleteChecklistItem(taskId: string, itemId: string): Promise<void> {
    const data = await apiJson<BootstrapData>(`/tasks/${taskId}/checklist/${itemId}`, {
      method: "DELETE",
    });
    applyBootstrap(data, getStoredUserId());
  },

  async saveTimeTracking(taskId: string, minutes: number): Promise<void> {
    const data = await apiJson<BootstrapData>(`/tasks/${taskId}/time/stop`, {
      method: "POST",
      body: JSON.stringify({ minutes }),
    });
    applyBootstrap(data, getStoredUserId());
  },

  async getActivityFeed(): Promise<any[]> {
    return apiJson<any[]>("/activity", { method: "GET" });
  },

  async addComment(taskId: string, text: string): Promise<void> {
    const data = await apiJson<any>(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    applyBootstrap(data, getStoredUserId());
  },

  async deleteComment(taskId: string, commentId: string): Promise<void> {
    const data = await apiJson<any>(`/tasks/${taskId}/comments/${commentId}`, {
      method: "DELETE",
    });
    applyBootstrap(data, getStoredUserId());
  },

  async sendTaskMessage(taskId: string, text: string, isAdmin?: boolean): Promise<void> {
    const data = await apiJson<any>(`/tasks/${taskId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text, isAdmin }),
    });
    applyBootstrap(data, getStoredUserId());
  },

  async getDailyStatus(memberId: string, date: string): Promise<any> {
    return apiJson<any>(`/daily-status/${memberId}/${date}`, { method: "GET" });
  },

  async submitDailyStatus(data: {
    memberId: string;
    date: string;
    completedToday: string;
    pendingTasks: string[];
    notes: string;
  }): Promise<void> {
    await apiJson<any>("/daily-status", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async reviewTaskCompletion(
    taskId: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ): Promise<void> {
    const data = await apiJson<any>(`/tasks/${taskId}/review`, {
      method: "POST",
      body: JSON.stringify({ status, rejectionReason }),
    });
    applyBootstrap(data, getStoredUserId());
  },

  async getPendingReviews(): Promise<any[]> {
    return apiJson<any[]>("/tasks/reviews/pending", { method: "GET" });
  },
};
