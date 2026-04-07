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
import { generateId, isPastDate } from "./storageTypes";

function generateAvatarSeed(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toLowerCase())
    .join("");
}

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getAuthState(): AuthState {
  const raw = localStorage.getItem("auth");
  if (!raw) return { loggedIn: false, userId: null };

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (typeof parsed === "boolean") {
      if (!parsed) return { loggedIn: false, userId: null };

      const users = get<User[]>("users", []);
      if (users.length > 0) {
        return { loggedIn: true, userId: users[0]?.id ?? null };
      }

      const members = get<Member[]>("members", []);
      const adminMember = members.find((m) => m.role === "Admin") ?? members[0];
      const defaultAdminUsername = "admin";
      const defaultAdminPassword = "admin123";

      if (adminMember?.id) {
        const newUser: User = {
          id: generateId(),
          memberId: adminMember.id,
          username: defaultAdminUsername,
          password: defaultAdminPassword,
        };
        set("users", [newUser, ...users]);
        return { loggedIn: true, userId: newUser.id };
      }
      return { loggedIn: false, userId: null };
    }

    if (typeof parsed === "object" && parsed !== null) {
      const obj = parsed as Partial<AuthState> & Record<string, unknown>;
      const notificationsRead =
        obj.notificationsRead && typeof obj.notificationsRead === "object" && obj.notificationsRead !== null
          ? (obj.notificationsRead as Record<string, number>)
          : undefined;
      return {
        loggedIn: !!obj.loggedIn,
        userId: typeof obj.userId === "string" ? obj.userId : null,
        notificationsRead,
      };
    }
  } catch {
    /* ignore */
  }

  return { loggedIn: false, userId: null };
}

function memberRole(member: Member | undefined): Role {
  return member?.role ?? "Intern";
}

function ensureSeedData() {
  if (typeof window === "undefined") return;
  const members = get<Member[]>("members", []);
  const users = get<User[]>("users", []);

  if (members.length > 0 && users.length > 0) {
    if (members.some((m) => !m.role)) {
      const next = members.map((m) => ({
        ...m,
        role: m.role ?? "Intern",
        avatarSeed: m.avatarSeed ?? generateAvatarSeed(m.name),
      }));
      set("members", next);
    }
    return;
  }

  if (members.length === 0 && users.length === 0) {
    const adminMember: Member = { id: generateId(), name: "System Admin", role: "Admin", avatarSeed: "admin" };
    const employeeMember: Member = { id: generateId(), name: "Employee (Jane)", role: "Employee", avatarSeed: "emp" };
    const internMember: Member = { id: generateId(), name: "Intern (Mike)", role: "Intern", avatarSeed: "intern" };

    set("members", [adminMember, employeeMember, internMember]);

    const defaultUsers: User[] = [
      { id: generateId(), memberId: adminMember.id, username: "admin", password: "admin123" },
      { id: generateId(), memberId: employeeMember.id, username: "employee", password: "employee123" },
      { id: generateId(), memberId: internMember.id, username: "intern", password: "intern123" },
    ];
    set("users", defaultUsers);
  }

  if (members.length > 0 && users.length === 0) {
    const baseByRole: Record<Role, { username: string; password: string }> = {
      Admin: { username: "admin", password: "admin123" },
      Employee: { username: "employee", password: "employee123" },
      Intern: { username: "intern", password: "intern123" },
    };

    const nextUsers: User[] = [];
    for (const m of members) {
      const r = m.role ?? "Intern";
      const base = baseByRole[r];
      let candidate = base.username;
      let i = 2;
      while (nextUsers.some((u) => u.username.toLowerCase() === candidate.toLowerCase())) {
        candidate = `${base.username}${i}`;
        i += 1;
      }
      nextUsers.push({ id: generateId(), memberId: m.id, username: candidate, password: base.password });
    }
    set("users", nextUsers);
  }

  set("attendance", get<AttendanceRecord[]>("attendance", []));
  set("tasks", get<Task[]>("tasks", []));
  set("holidays", get<Holiday[]>("holidays", []));
  set("pendingUsers", get<PendingUser[]>("pendingUsers", []));
  set("userNotifications", get<UserNotification[]>("userNotifications", []));

  const legacyReports = get<WorkReport[]>("workReports", []);
  const reports = get<WorkReport[]>("reports", []);
  if (reports.length === 0 && legacyReports.length > 0) set("reports", legacyReports);
}

ensureSeedData();

function migrateReportsIfNeeded(): WorkReport[] {
  const reports = get<WorkReport[]>("reports", []);
  if (reports.length > 0) return reports;
  const legacy = get<WorkReport[]>("workReports", []);
  if (legacy.length > 0) {
    set("reports", legacy);
    return legacy;
  }
  return [];
}

export const localStorageImpl = {
  getAuth: (): AuthState => getAuthState(),
  isLoggedIn: () => getAuthState().loggedIn,
  login: (username: string, password: string): Promise<boolean> => {
    const users = get<User[]>("users", []);
    const normalizedUsername = username.trim().toLowerCase();
    const user = users.find((u) => u.username.trim().toLowerCase() === normalizedUsername && u.password === password);
    if (!user) return Promise.resolve(false);
    set("auth", { loggedIn: true, userId: user.id } satisfies AuthState);
    return Promise.resolve(true);
  },
  logout: () => set("auth", { loggedIn: false, userId: null } satisfies AuthState),
  hydrate: (): Promise<void> => Promise.resolve(),

  getUsers: (): User[] => get<User[]>("users", []),
  setUsers: (u: User[]) => set("users", u),
  getPendingUsers: (): PendingUser[] => get<PendingUser[]>("pendingUsers", []),
  setPendingUsers: (p: PendingUser[]) => set("pendingUsers", p),
  getUserNotifications: (): UserNotification[] => {
    const all = get<UserNotification[]>("userNotifications", []);
    if (localStorageImpl.getCurrentRole() === "Admin") return all;
    const me = localStorageImpl.getCurrentMember();
    if (!me?.id) return [];
    return all.filter((n) => n.targetMemberIds.includes(me.id));
  },
  setUserNotifications: (n: UserNotification[]) => set("userNotifications", n),

  getMembers: (): Member[] => {
    const members = get<Member[]>("members", []);
    if (members.length > 0 && members.some((m) => !m.role)) {
      const next = members.map((m) => ({
        ...m,
        role: m.role ?? "Intern",
        avatarSeed: m.avatarSeed ?? generateAvatarSeed(m.name),
      }));
      set("members", next);
      return next;
    }
    return members;
  },
  setMembers: (m: Member[]) => set("members", m),

  getCurrentUserId: (): string | null => getAuthState().userId,
  getCurrentMember: (): Member | null => {
    const { loggedIn, userId } = getAuthState();
    if (!loggedIn || !userId) return null;
    const user = get<User[]>("users", []).find((u) => u.id === userId);
    if (!user) return null;
    return localStorageImpl.getMembers().find((m) => m.id === user.memberId) ?? null;
  },
  getCurrentRole: (): Role => memberRole(localStorageImpl.getCurrentMember() ?? undefined),
  isAdmin: () => localStorageImpl.getCurrentRole() === "Admin",
  isIntern: () => localStorageImpl.getCurrentRole() === "Intern",

  markNotificationRead: (key: string) => {
    const auth = getAuthState();
    const next: AuthState = {
      ...auth,
      notificationsRead: {
        ...(auth.notificationsRead ?? {}),
        [key]: Date.now(),
      },
    };
    set("auth", next);
  },

  canEditAttendanceDate: (dateStr: string): boolean => {
    const role = localStorageImpl.getCurrentRole();
    if (role === "Admin") return true;
    if (role === "Intern") return !isPastDate(dateStr);
    return true;
  },

  canEditReportDate: (dateStr: string): boolean => {
    const role = localStorageImpl.getCurrentRole();
    if (role === "Admin") return true;
    if (role === "Intern") return !isPastDate(dateStr);
    return true;
  },

  getAttendance: () => {
    const all = get<AttendanceRecord[]>("attendance", []);
    if (localStorageImpl.getCurrentRole() === "Admin") return all;
    const me = localStorageImpl.getCurrentMember();
    if (!me?.id) return [];
    return all.filter((a) => a.memberId === me.id);
  },
  setAttendance: (a: AttendanceRecord[]) => set("attendance", a),

  getTasks: (): Task[] => {
    const all = get<Task[]>("tasks", []);
    if (localStorageImpl.getCurrentRole() === "Admin") return all;
    const me = localStorageImpl.getCurrentMember();
    if (!me?.id) return [];
    return all.filter((t) => {
      const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
      return assignees.includes(me.id);
    });
  },
  setTasks: (t: Task[]) => set("tasks", t),

  getReports: (): WorkReport[] => {
    const all = migrateReportsIfNeeded();
    if (localStorageImpl.getCurrentRole() === "Admin") return all;
    const me = localStorageImpl.getCurrentMember();
    if (!me?.id) return [];
    return all.filter((r) => r.memberId === me.id);
  },
  setReports: (r: WorkReport[]) => set("reports", r),

  getWorkReports: (): WorkReport[] => localStorageImpl.getReports(),
  setWorkReports: (w: WorkReport[]) => set("reports", w),

  getHolidays: (): Holiday[] => get<Holiday[]>("holidays", []),
  setHolidays: (h: Holiday[]) => set("holidays", h),

  async submitAttendance(data: {
    date: string;
    loginTime: string;
    logoutTime: string;
    lunchStartTime?: string;
    lunchEndTime?: string;
  }): Promise<void> {
    const { calculateHours, getStatus } = await import("./storageTypes");
    const attendance = get<AttendanceRecord[]>("attendance", []);
    const currentMember = localStorageImpl.getCurrentMember();
    const hours = calculateHours(data.loginTime, data.logoutTime, data.lunchStartTime, data.lunchEndTime);
    const status = getStatus(hours);

    const newRecord: AttendanceRecord = {
      id: generateId(),
      date: data.date,
      memberId: currentMember?.id ?? "",
      loginTime: data.loginTime,
      logoutTime: data.logoutTime,
      lunchStartTime: data.lunchStartTime,
      lunchEndTime: data.lunchEndTime,
      hours,
      status,
      approvalStatus: localStorageImpl.isAdmin() ? "Approved" : "Pending",
      submittedAt: Date.now(),
      submittedBy: currentMember?.id,
      approvedAt: localStorageImpl.isAdmin() ? Date.now() : undefined,
      approvedBy: localStorageImpl.isAdmin() ? currentMember?.id : undefined,
    };

    // Check if record already exists for this date
    const existing = attendance.findIndex(
      (a) => a.date === data.date && a.memberId === currentMember?.id && a.approvalStatus === "Approved"
    );
    if (existing >= 0) {
      throw new Error("Attendance already approved for this date");
    }

    set("attendance", [...attendance, newRecord]);
  },

  async approveAttendance(id: string): Promise<void> {
    const attendance = get<AttendanceRecord[]>("attendance", []);
    const index = attendance.findIndex((a) => a.id === id);
    if (index >= 0) {
      const currentMember = localStorageImpl.getCurrentMember();
      attendance[index].approvalStatus = "Approved";
      attendance[index].approvedAt = Date.now();
      attendance[index].approvedBy = currentMember?.id;
      set("attendance", attendance);
    }
  },

  async rejectAttendance(id: string, reason: string): Promise<void> {
    const attendance = get<AttendanceRecord[]>("attendance", []);
    const index = attendance.findIndex((a) => a.id === id);
    if (index >= 0) {
      attendance[index].approvalStatus = "Rejected";
      attendance[index].rejectionReason = reason;
      set("attendance", attendance);
    }
  },

  async approvePending(id: string): Promise<void> {
    const pending = get<PendingUser[]>("pendingUsers", []);
    const pendingUser = pending.find((p) => p.id === id);
    if (!pendingUser) throw new Error("User not found");

    const members = localStorageImpl.getMembers();
    const users = localStorageImpl.getUsers();

    const newMember: Member = {
      id: generateId(),
      name: pendingUser.name,
      role: pendingUser.role,
      avatarSeed: pendingUser.name.slice(0, 3).toLowerCase(),
    };

    const newUser: User = {
      id: generateId(),
      memberId: newMember.id,
      username: pendingUser.username,
      password: pendingUser.password,
    };

    localStorageImpl.setMembers([...members, newMember]);
    localStorageImpl.setUsers([...users, newUser]);
    localStorageImpl.setPendingUsers(pending.filter((p) => p.id !== id));
  },

  async rejectPending(id: string): Promise<void> {
    const pending = get<PendingUser[]>("pendingUsers", []);
    localStorageImpl.setPendingUsers(pending.filter((p) => p.id !== id));
  },

  // ========== NEW TASK METHODS (ClickUp Features) ==========

  async updateTask(id: string, updates: Partial<any>): Promise<void> {
    const tasks = get<Task[]>("tasks", []);
    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex >= 0) {
      tasks[taskIndex] = { ...tasks[taskIndex], ...updates, updatedAt: Date.now() };
      set("tasks", tasks);
    }
  },

  async addSubtask(taskId: string, title: string): Promise<void> {
    const tasks = get<Task[]>("tasks", []);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      if (!task.subtasks) task.subtasks = [];
      task.subtasks.push({
        id: generateId(),
        title,
        completed: false,
        createdAt: Date.now(),
      });
      task.updatedAt = Date.now();
      set("tasks", tasks);
    }
  },

  async updateSubtask(taskId: string, subtaskId: string, updates: Partial<any>): Promise<void> {
    const tasks = get<Task[]>("tasks", []);
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.subtasks) {
      const subtask = task.subtasks.find((s) => s.id === subtaskId);
      if (subtask) {
        Object.assign(subtask, updates);
        task.updatedAt = Date.now();
        set("tasks", tasks);
      }
    }
  },

  async deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
    const tasks = get<Task[]>("tasks", []);
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.subtasks) {
      task.subtasks = task.subtasks.filter((s) => s.id !== subtaskId);
      task.updatedAt = Date.now();
      set("tasks", tasks);
    }
  },

  async addChecklistItem(taskId: string, text: string): Promise<void> {
    const tasks = get<Task[]>("tasks", []);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      if (!task.checklist) task.checklist = [];
      task.checklist.push({
        id: generateId(),
        text,
        completed: false,
      });
      task.updatedAt = Date.now();
      set("tasks", tasks);
    }
  },

  async updateChecklistItem(taskId: string, itemId: string, updates: Partial<any>): Promise<void> {
    const tasks = get<Task[]>("tasks", []);
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.checklist) {
      const item = task.checklist.find((i) => i.id === itemId);
      if (item) {
        Object.assign(item, updates);
        task.updatedAt = Date.now();
        set("tasks", tasks);
      }
    }
  },

  async deleteChecklistItem(taskId: string, itemId: string): Promise<void> {
    const tasks = get<Task[]>("tasks", []);
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.checklist) {
      task.checklist = task.checklist.filter((i) => i.id !== itemId);
      task.updatedAt = Date.now();
      set("tasks", tasks);
    }
  },

  async saveTimeTracking(taskId: string, minutes: number): Promise<void> {
    const tasks = get<Task[]>("tasks", []);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      task.timeSpent = (task.timeSpent ?? 0) + minutes;
      task.updatedAt = Date.now();
      set("tasks", tasks);
    }
  },

  async getActivityFeed(): Promise<any[]> {
    // Local mode does not persist a rich activity stream yet.
    return [];
  },

  async getActivityLog(): Promise<any[]> {
    return [];
  },

  async getTask(taskId: string): Promise<Task | null> {
    return localStorageImpl.getTasks().find((t) => t.id === taskId) ?? null;
  },

  async addComment(taskId: string, text: string): Promise<void> {
    const tasks = get<Task[]>("tasks", []);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      if (!task.comments) task.comments = [];
      const currentUser = this.getCurrentMember();
      task.comments.push({
        id: generateId(),
        taskId,
        memberId: currentUser?.id || "unknown",
        text,
        createdAt: Date.now(),
      });
      task.updatedAt = Date.now();
      set("tasks", tasks);
    }
  },

  async deleteComment(taskId: string, commentId: string): Promise<void> {
    const tasks = get<Task[]>("tasks", []);
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.comments) {
      task.comments = task.comments.filter((c) => c.id !== commentId);
      task.updatedAt = Date.now();
      set("tasks", tasks);
    }
  },

  async sendTaskMessage(taskId: string, text: string, isAdmin?: boolean): Promise<void> {
    const tasks = get<Task[]>("tasks", []);
    const task = tasks.find((t) => t.id === taskId);
    const currentUser = this.getCurrentMember();
    if (task && currentUser) {
      if (!task.messages) task.messages = [];
      task.messages.push({
        id: generateId(),
        taskId,
        senderId: currentUser.id,
        senderRole: currentUser.role || "Intern",
        text,
        taskSnapshot: {
          title: task.title,
          status: task.status,
          priority: task.priority,
        },
        createdAt: Date.now(),
        isAdmin,
      } as any);
      task.updatedAt = Date.now();
      set("tasks", tasks);
    }
  },

  async getDailyStatus(memberId: string, date: string): Promise<any> {
    const statuses = get<any[]>("dailyStatuses", []);
    return statuses.find((s) => s.memberId === memberId && s.date === date) || null;
  },

  async submitDailyStatus(data: {
    memberId: string;
    date: string;
    completedToday: string;
    pendingTasks: string[];
    notes: string;
  }): Promise<void> {
    const statuses = get<any[]>("dailyStatuses", []);
    const existingIdx = statuses.findIndex((s) => s.memberId === data.memberId && s.date === data.date);
    const statusRecord = {
      id: generateId(),
      ...data,
      submittedAt: Date.now(),
    };
    if (existingIdx >= 0) {
      statuses[existingIdx] = statusRecord;
    } else {
      statuses.push(statusRecord);
    }
    set("dailyStatuses", statuses);
  },

  async reviewTaskCompletion(
    taskId: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ): Promise<void> {
    const tasks = get<Task[]>("tasks", []);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      if (!task.review) task.review = { status: "pending" };
      task.review.status = status;
      task.review.rejectionReason = rejectionReason;
      task.review.reviewedAt = Date.now();
      task.review.reviewedBy = this.getCurrentMember()?.id;
      if (status === "rejected") {
        task.status = "In Progress";
      }
      task.updatedAt = Date.now();
      set("tasks", tasks);
    }
  },

  async getPendingReviews(): Promise<any[]> {
    const tasks = get<Task[]>("tasks", []);
    return tasks.filter((t) => t.status === "Completed" && (!t.review || t.review.status === "pending"));
  },
};
