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
  getUserNotifications: (): UserNotification[] => get<UserNotification[]>("userNotifications", []),
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

  getAttendance: () => get<AttendanceRecord[]>("attendance", []),
  setAttendance: (a: AttendanceRecord[]) => set("attendance", a),

  getTasks: (): Task[] => get<Task[]>("tasks", []),
  setTasks: (t: Task[]) => set("tasks", t),

  getReports: (): WorkReport[] => migrateReportsIfNeeded(),
  setReports: (r: WorkReport[]) => set("reports", r),

  getWorkReports: (): WorkReport[] => migrateReportsIfNeeded(),
  setWorkReports: (w: WorkReport[]) => set("reports", w),

  getHolidays: (): Holiday[] => get<Holiday[]>("holidays", []),
  setHolidays: (h: Holiday[]) => set("holidays", h),
};
