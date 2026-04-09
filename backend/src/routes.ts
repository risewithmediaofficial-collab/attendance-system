import { randomUUID } from "node:crypto";
import type { Router } from "express";
import { Router as createRouter } from "express";
import {
  ActivityLog,
  AttendanceRecord,
  DailyStatus,
  Holiday,
  Member,
  PendingUser,
  Task,
  User,
  UserNotification,
  WorkReport,
} from "./models.js";
import { authMiddleware, hashPassword, requireAdmin, signToken, verifyPassword } from "./auth.js";
import type { AuthedRequest } from "./auth.js";
import { EmailService } from "./services/email.service.js";

type ViewerContext = {
  role?: string;
  memberId?: string;
  userId?: string;
};

function assigneeIds(assignedTo: unknown): string[] {
  return Array.isArray(assignedTo) ? assignedTo.map(String) : [String(assignedTo)];
}

function isAdminViewer(viewer?: ViewerContext): boolean {
  return viewer?.role === "Admin";
}

function canAccessTask(task: { assignedTo: unknown }, viewer?: ViewerContext): boolean {
  if (isAdminViewer(viewer)) return true;
  if (!viewer?.memberId) return false;
  return assigneeIds(task.assignedTo).includes(viewer.memberId);
}

function viewerFromReq(req: AuthedRequest): ViewerContext {
  return { role: req.role, memberId: req.memberId, userId: req.userId };
}

async function bootstrapPayload(viewer?: ViewerContext) {
  const [members, users, pendingUsers, attendance, tasks, dailyStatuses, holidays, workReports, userNotifications] =
    await Promise.all([
      Member.find().lean(),
      User.find().lean(),
      PendingUser.find().sort({ createdAt: -1 }).lean(),
      AttendanceRecord.find().lean(),
      Task.find().lean(),
      DailyStatus.find().lean(),
      Holiday.find().lean(),
      WorkReport.find().lean(),
      UserNotification.find().sort({ createdAt: -1 }).lean(),
    ]);

  const adminView = isAdminViewer(viewer);
  const memberId = viewer?.memberId ?? "";
  const userId = viewer?.userId ?? "";

  const visibleTasks = adminView ? tasks : tasks.filter((t) => canAccessTask(t, viewer));
  const visibleAttendance = adminView ? attendance : attendance.filter((a) => a.memberId === memberId);
  const visibleDailyStatuses = adminView ? dailyStatuses : dailyStatuses.filter((d) => d.memberId === memberId);
  const visibleReports = adminView ? workReports : workReports.filter((r) => r.memberId === memberId);
  const visibleNotifications = adminView
    ? userNotifications
    : userNotifications.filter((n) => Array.isArray(n.targetMemberIds) && n.targetMemberIds.includes(memberId));

  const allowedMemberIds = new Set<string>();
  if (memberId) allowedMemberIds.add(memberId);
  if (adminView) {
    members.forEach((m) => allowedMemberIds.add(m._id));
  } else {
    visibleTasks.forEach((t) => {
      assigneeIds(t.assignedTo).forEach((id) => allowedMemberIds.add(id));
      t.comments?.forEach((c: any) => allowedMemberIds.add(String(c.memberId)));
      t.messages?.forEach((m: any) => allowedMemberIds.add(String(m.senderId)));
    });
    visibleAttendance.forEach((a) => allowedMemberIds.add(a.memberId));
    visibleDailyStatuses.forEach((d: any) => allowedMemberIds.add(d.memberId));
  }

  const visibleMembers = members.filter((m) => allowedMemberIds.has(m._id));
  const visibleUsers = adminView ? users : users.filter((u) => u._id === userId);
  const visiblePendingUsers = adminView ? pendingUsers : [];

  return {
    members: visibleMembers.map((m) => ({
      id: m._id,
      name: m.name,
      role: m.role as "Admin" | "Employee" | "Intern",
      avatarSeed: m.avatarSeed ?? undefined,
    })),
    users: visibleUsers.map((u) => ({
      id: u._id,
      memberId: u.memberId,
      username: u.username,
      password: "",
    })),
    pendingUsers: visiblePendingUsers.map((p) => ({
      id: p._id,
      name: p.name,
      username: p.username,
      password: "",
      role: p.role as "Admin" | "Employee" | "Intern",
      createdAt: p.createdAt,
    })),
    attendance: visibleAttendance.map((a) => ({
      id: a._id,
      date: a.date,
      memberId: a.memberId,
      loginTime: a.loginTime,
      logoutTime: a.logoutTime,
      lunchStartTime: a.lunchStartTime ?? undefined,
      lunchEndTime: a.lunchEndTime ?? undefined,
      hours: a.hours,
      status: a.status as "Full Day" | "Half Day" | "Short",
      approvalStatus: (a.approvalStatus ?? "Pending") as "Pending" | "Approved" | "Rejected",
      submittedAt: a.submittedAt ?? undefined,
      submittedBy: a.submittedBy ?? undefined,
      approvedAt: a.approvedAt ?? undefined,
      approvedBy: a.approvedBy ?? undefined,
      rejectionReason: a.rejectionReason ?? undefined,
    })),
    tasks: visibleTasks.map((t) => ({
      id: t._id,
      title: t.title,
      description: t.description,
      assignedTo: Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo],
      deadline: t.deadline,
      priority: t.priority as "Low" | "Medium" | "High",
      status: t.status as "Assigned" | "In Progress" | "Completed",
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      completedAt: t.completedAt ?? undefined,
      tags: t.tags ?? undefined,
      subtasks: t.subtasks?.map((s: any) => ({
        id: s._id,
        title: s.title,
        completed: s.completed ?? false,
        createdAt: s.createdAt,
      })) ?? undefined,
      checklist: t.checklist?.map((c: any) => ({
        id: c._id,
        text: c.text,
        completed: c.completed ?? false,
      })) ?? undefined,
      dependencies: t.dependencies ?? undefined,
      project: t.project ?? undefined,
      isRecurring: t.isRecurring ?? undefined,
      recurringPattern: t.recurringPattern ?? undefined,
      isFavorite: t.isFavorite ?? undefined,
      timeSpent: t.timeSpent ?? undefined,
      reminders: t.reminders?.map((r: any) => ({
        id: r._id,
        date: r.date,
        time: r.time,
      })) ?? undefined,
      comments: t.comments?.map((c: any) => ({
        id: c._id,
        taskId: t._id,
        memberId: c.memberId,
        text: c.text,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt ?? undefined,
      })) ?? undefined,
      messages: t.messages?.map((m: any) => ({
        id: m._id,
        taskId: m.taskId,
        senderId: m.senderId,
        senderRole: m.senderRole,
        text: m.text,
        taskSnapshot: m.taskSnapshot ?? undefined,
        createdAt: m.createdAt,
        isAdmin: m.isAdmin ?? false,
      })) ?? undefined,
      review: t.review ? {
        status: t.review.status,
        rejectionReason: t.review.rejectionReason ?? undefined,
        reviewedBy: t.review.reviewedBy ?? undefined,
        reviewedAt: t.review.reviewedAt ?? undefined,
      } : undefined,
      completedDate: t.completedDate ?? undefined,
    })),
    dailyStatuses: visibleDailyStatuses.map((d: any) => ({
      id: d._id,
      memberId: d.memberId,
      date: d.date,
      completedToday: d.completedToday,
      pendingTasks: d.pendingTasks ?? [],
      notes: d.notes ?? undefined,
      submittedAt: d.submittedAt,
    })),
    holidays: holidays.map((h) => ({ id: h._id, date: h.date, reason: h.reason })),
    reports: visibleReports.map((r) => ({
      id: r._id,
      date: r.date,
      memberId: r.memberId,
      assigned: r.assigned,
      completed: r.completed,
      pending: r.pending,
      delivery: r.delivery as "Done" | "Not Done",
    })),
    userNotifications: visibleNotifications.map((n) => ({
      id: n._id,
      title: n.title,
      message: n.message,
      targetMemberIds: Array.isArray(n.targetMemberIds) ? n.targetMemberIds : [],
      targetRole: (n.targetRole ?? undefined) as "Employee" | "Intern" | undefined,
      createdAt: n.createdAt,
      createdBy: n.createdBy,
    })),
  };
}

export function apiRouter(): Router {
  const r = createRouter();
  const emailService = new EmailService();
  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  r.get("/bootstrap", authMiddleware, async (req, res) => {
    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  r.post("/auth/login", async (req, res) => {
    const username = String(req.body?.username ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }
    const user = await User.findOne({ username }).lean();
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const member = await Member.findById(user.memberId).lean();
    if (!member) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, memberId: user.memberId, username: user.username, password: "" },
      member: {
        id: member._id,
        name: member.name,
        role: member.role,
      },
    });
  });

  r.post("/auth/register", async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const username = String(req.body?.username ?? "").trim().toLowerCase();
    const email = normalizeEmail(String(req.body?.email ?? ""));
    const password = String(req.body?.password ?? "");
    const role = String(req.body?.role ?? "Intern");
    
    // Enhanced validation with specific error messages
    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    if (!username) {
      res.status(400).json({ error: "Username is required" });
      return;
    }
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      res.status(400).json({ error: "Valid email address required" });
      return;
    }
    if (!password) {
      res.status(400).json({ error: "Password is required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    if (role !== "Employee" && role !== "Intern") {
      res.status(400).json({ error: "Invalid role" });
      return;
    }
    
    const takenUser = await User.findOne({ username });
    const takenPending = await PendingUser.findOne({ username });
    if (takenUser || takenPending) {
      res.status(409).json({ error: "Username taken" });
      return;
    }

    const takenUserEmail = await User.findOne({ email });
    const takenPendingEmail = await PendingUser.findOne({ email });
    if (takenUserEmail || takenPendingEmail) {
      res.status(409).json({ error: "Email already exists" });
      return;
    }
    
    const id = randomUUID();
    const passwordHash = await hashPassword(password);
    await PendingUser.create({
      _id: id,
      name,
      username,
      email,
      passwordHash,
      role,
      createdAt: Date.now(),
    });
    res.status(201).json({ ok: true });
  });

  r.get("/auth/verify-email", async (req, res) => {
    const token = typeof req.query?.token === "string" ? req.query.token.trim() : "";
    if (!token) {
      res.status(400).json({ success: false, error: "Verification token is required" });
      return;
    }

    const hashedToken = emailService.hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).lean();

    if (!user) {
      res.status(400).json({ success: false, error: "Invalid or expired verification token" });
      return;
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { isEmailVerified: true },
        $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
      },
    );

    res.json({ success: true, message: "Email verified successfully" });
  });

  r.get("/auth/check-email-status", authMiddleware, async (req, res) => {
    if (!req.userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const user = await User.findById(req.userId).lean();
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const hasEmail = typeof user.email === "string" && user.email.trim().length > 0;
    res.json({
      success: true,
      data: {
        hasEmail,
        isVerified: Boolean(user.isEmailVerified),
        email: hasEmail ? user.email : undefined,
      },
    });
  });

  r.post("/auth/update-email", authMiddleware, async (req, res) => {
    if (!req.userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const email = normalizeEmail(String(req.body?.email ?? ""));
    if (!email || !email.includes("@") || !email.includes(".")) {
      res.status(400).json({ success: false, error: "Invalid email address" });
      return;
    }

    const user = await User.findById(req.userId).lean();
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const existingEmailUser = await User.findOne({
      email,
      _id: { $ne: req.userId },
    }).lean();
    if (existingEmailUser) {
      res.status(409).json({ success: false, error: "Email already exists" });
      return;
    }

    await User.updateOne(
      { _id: req.userId },
      {
        $set: { email, isEmailVerified: false },
        $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
      },
    );

    res.json({
      success: true,
      message: "Email updated successfully. Please send a verification email.",
    });
  });

  r.post("/auth/send-verification", authMiddleware, async (req, res) => {
    if (!req.userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const user = await User.findById(req.userId).lean();
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    if (!user.email) {
      res.status(400).json({ success: false, error: "No email address set for this account" });
      return;
    }
    if (user.isEmailVerified) {
      res.status(400).json({ success: false, error: "Email is already verified" });
      return;
    }

    const { token, hashedToken, expiry } = emailService.generateToken();
    await User.updateOne(
      { _id: req.userId },
      {
        $set: {
          emailVerificationToken: hashedToken,
          emailVerificationExpires: expiry,
        },
      },
    );

    const sendResult = await emailService.sendEmailVerification(user.email, token);
    if (!sendResult.success) {
      res.status(500).json({
        success: false,
        error: sendResult.error ?? "Failed to send verification email",
      });
      return;
    }

    res.json({ success: true, message: "Verification email sent" });
  });

  r.put("/members", authMiddleware, requireAdmin, async (req, res) => {
    const body = req.body;
    if (!Array.isArray(body)) {
      res.status(400).json({ error: "Expected array" });
      return;
    }
    await Member.deleteMany({});
    if (body.length > 0) {
      await Member.insertMany(
        body.map((m: { id: string; name: string; role?: string; avatarSeed?: string }) => ({
          _id: m.id,
          name: m.name,
          role: m.role ?? "Intern",
          avatarSeed: m.avatarSeed,
        })),
      );
    }
    res.json({ ok: true });
  });

  r.put("/users", authMiddleware, requireAdmin, async (req, res) => {
    const body = req.body;
    if (!Array.isArray(body)) {
      res.status(400).json({ error: "Expected array" });
      return;
    }
    const existing = await User.find().lean();
    const existingById = new Map(existing.map((u) => [u._id, u]));

    for (const u of body as { id: string; memberId: string; username: string; password?: string }[]) {
      const prev = existingById.get(u.id);
      const username = u.username.trim().toLowerCase();
      if (u.password && u.password.trim()) {
        const passwordHash = await hashPassword(u.password.trim());
        if (prev) {
          await User.updateOne({ _id: u.id }, { $set: { memberId: u.memberId, username, passwordHash } });
        } else {
          await User.create({ _id: u.id, memberId: u.memberId, username, passwordHash });
        }
      } else if (prev) {
        await User.updateOne({ _id: u.id }, { $set: { memberId: u.memberId, username } });
      } else {
        res.status(400).json({ error: `New user ${u.username} requires a password` });
        return;
      }
    }

    const keepIds = new Set((body as { id: string }[]).map((x) => x.id));
    const toDelete = existing.filter((x) => !keepIds.has(x._id)).map((x) => x._id);
    if (toDelete.length) {
      await User.deleteMany({ _id: { $in: toDelete } });
    }

    res.json({ ok: true });
  });

  r.post("/pending/:id/approve", authMiddleware, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const pending = await PendingUser.findById(id).lean();
    if (!pending) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const memberId = randomUUID();
    const userId = randomUUID();
    try {
      await Member.create({
        _id: memberId,
        name: pending.name,
        role: pending.role,
        avatarSeed: pending.name.slice(0, 3).toLowerCase(),
      });
      await User.create({
        _id: userId,
        memberId,
        username: pending.username,
        email: pending.email ?? undefined,
        isEmailVerified: false,
        passwordHash: pending.passwordHash,
      });
      await PendingUser.deleteOne({ _id: id });
    } catch (e) {
      await Member.deleteOne({ _id: memberId }).catch(() => {});
      await User.deleteOne({ _id: userId }).catch(() => {});
      throw e;
    }
    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  r.delete("/pending/:id", authMiddleware, requireAdmin, async (req, res) => {
    const { id } = req.params;
    await PendingUser.deleteOne({ _id: id });
    res.json({ ok: true });
  });

  r.put("/tasks", authMiddleware, async (req, res) => {
    if (!Array.isArray(req.body)) {
      res.status(400).json({ error: "Expected array" });
      return;
    }
    const incomingTasks = (req.body as Record<string, unknown>[]).map((t) => ({
      _id: String(t.id),
      title: String(t.title),
      description: String(t.description ?? ""),
      assignedTo: Array.isArray(t.assignedTo) ? t.assignedTo : [String(t.assignedTo)],
      deadline: String(t.deadline),
      priority: String(t.priority),
      status: String(t.status),
      createdAt: Number(t.createdAt),
      updatedAt: Number(t.updatedAt),
      completedAt: t.completedAt != null ? Number(t.completedAt) : undefined,
      tags: Array.isArray(t.tags) ? t.tags : undefined,
      subtasks: Array.isArray(t.subtasks) ? (t.subtasks as any[]).map((s) => ({
        _id: String(s.id),
        title: String(s.title),
        completed: Boolean(s.completed),
        createdAt: Number(s.createdAt),
      })) : undefined,
      checklist: Array.isArray(t.checklist) ? (t.checklist as any[]).map((c) => ({
        _id: String(c.id),
        text: String(c.text),
        completed: Boolean(c.completed),
      })) : undefined,
      dependencies: Array.isArray(t.dependencies) ? t.dependencies : undefined,
      project: t.project ? String(t.project) : undefined,
      isRecurring: Boolean(t.isRecurring),
      recurringPattern: t.recurringPattern ? String(t.recurringPattern) : undefined,
      isFavorite: Boolean(t.isFavorite),
      timeSpent: t.timeSpent ? Number(t.timeSpent) : undefined,
      reminders: Array.isArray(t.reminders) ? (t.reminders as any[]).map((r) => ({
        _id: String(r.id),
        date: String(r.date),
        time: String(r.time),
      })) : undefined,
      comments: Array.isArray(t.comments) ? (t.comments as any[]).map((c) => ({
        _id: String(c.id),
        memberId: String(c.memberId),
        text: String(c.text),
        createdAt: Number(c.createdAt),
        updatedAt: c.updatedAt ? Number(c.updatedAt) : undefined,
      })) : undefined,
    }));

    if (req.role === "Admin") {
      await Task.deleteMany({});
      if (incomingTasks.length > 0) {
        await Task.insertMany(incomingTasks);
      }
      res.json({ ok: true });
      return;
    }

    if (!req.memberId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const memberId = req.memberId;
    for (const task of incomingTasks) {
      if (!assigneeIds(task.assignedTo).includes(memberId)) {
        res.status(403).json({ error: "Cannot sync tasks outside your assignment scope" });
        return;
      }
    }

    const existing = await Task.find().lean();
    const existingById = new Map(existing.map((t: any) => [t._id, t]));
    const canAccess = (task: any) => assigneeIds(task.assignedTo).includes(memberId);

    for (const task of incomingTasks) {
      const existingTask = existingById.get(task._id);
      if (existingTask && !canAccess(existingTask)) {
        res.status(403).json({ error: "Cannot modify tasks outside your assignment scope" });
        return;
      }
    }

    const keepOtherTasks = existing.filter((t: any) => !canAccess(t));
    const ownTasksMap = new Map(
      existing.filter((t: any) => canAccess(t)).map((t: any) => [t._id, t]),
    );
    for (const task of incomingTasks) {
      ownTasksMap.set(task._id, task);
    }

    const mergedTasks = [...keepOtherTasks, ...Array.from(ownTasksMap.values())];
    await Task.deleteMany({});
    if (mergedTasks.length > 0) {
      await Task.insertMany(mergedTasks);
    }
    res.json({ ok: true });
  });

  r.put("/attendance", authMiddleware, requireAdmin, async (req, res) => {
    if (!Array.isArray(req.body)) {
      res.status(400).json({ error: "Expected array" });
      return;
    }
    await AttendanceRecord.deleteMany({});
    if (req.body.length > 0) {
      await AttendanceRecord.insertMany(
        (req.body as Record<string, unknown>[]).map((a) => ({
          _id: String(a.id),
          date: String(a.date),
          memberId: String(a.memberId),
          loginTime: String(a.loginTime),
          logoutTime: String(a.logoutTime),
          lunchStartTime: a.lunchStartTime ? String(a.lunchStartTime) : undefined,
          lunchEndTime: a.lunchEndTime ? String(a.lunchEndTime) : undefined,
          hours: Number(a.hours),
          status: String(a.status),
          approvalStatus: a.approvalStatus ? String(a.approvalStatus) : "Pending",
          submittedAt: a.submittedAt ? Number(a.submittedAt) : undefined,
          submittedBy: a.submittedBy ? String(a.submittedBy) : undefined,
          approvedAt: a.approvedAt ? Number(a.approvedAt) : undefined,
          approvedBy: a.approvedBy ? String(a.approvedBy) : undefined,
          rejectionReason: a.rejectionReason ? String(a.rejectionReason) : undefined,
        })),
      );
    }
    res.json({ ok: true });
  });

  r.put("/holidays", authMiddleware, requireAdmin, async (req, res) => {
    if (!Array.isArray(req.body)) {
      res.status(400).json({ error: "Expected array" });
      return;
    }
    await Holiday.deleteMany({});
    if (req.body.length > 0) {
      await Holiday.insertMany(
        (req.body as { id: string; date: string; reason: string }[]).map((h) => ({
          _id: h.id,
          date: h.date,
          reason: h.reason,
        })),
      );
    }
    res.json({ ok: true });
  });

  r.put("/reports", authMiddleware, requireAdmin, async (req, res) => {
    if (!Array.isArray(req.body)) {
      res.status(400).json({ error: "Expected array" });
      return;
    }
    await WorkReport.deleteMany({});
    if (req.body.length > 0) {
      await WorkReport.insertMany(
        (req.body as Record<string, unknown>[]).map((r) => ({
          _id: String(r.id),
          date: String(r.date),
          memberId: String(r.memberId),
          assigned: String(r.assigned),
          completed: String(r.completed),
          pending: String(r.pending),
          delivery: String(r.delivery),
        })),
      );
    }
    res.json({ ok: true });
  });

  r.put("/notifications", authMiddleware, requireAdmin, async (req, res) => {
    if (!Array.isArray(req.body)) {
      res.status(400).json({ error: "Expected array" });
      return;
    }
    await UserNotification.deleteMany({});
    if (req.body.length > 0) {
      await UserNotification.insertMany(
        (req.body as Record<string, unknown>[]).map((n) => ({
          _id: String(n.id),
          title: String(n.title),
          message: String(n.message),
          targetMemberIds: Array.isArray(n.targetMemberIds) ? (n.targetMemberIds as string[]) : [],
          targetRole: n.targetRole != null ? String(n.targetRole) : undefined,
          createdAt: Number(n.createdAt),
          createdBy: String(n.createdBy),
        })),
      );
    }
    res.json({ ok: true });
  });

  // Helper function to calculate hours
  function calculateWorkHours(loginTime: string, logoutTime: string, lunchStartTime?: string, lunchEndTime?: string): number {
    const [lh, lm] = loginTime.split(":").map(Number);
    const [oh, om] = logoutTime.split(":").map(Number);
    let totalMinutes = oh * 60 + om - (lh * 60 + lm);
    
    if (lunchStartTime && lunchEndTime) {
      const [slh, slm] = lunchStartTime.split(":").map(Number);
      const [elh, elm] = lunchEndTime.split(":").map(Number);
      const lunchMinutes = elh * 60 + elm - (slh * 60 + slm);
      totalMinutes -= lunchMinutes;
    }
    
    return Math.max(0, +(totalMinutes / 60).toFixed(2));
  }

  // Helper function to get status
  function getAttendanceStatus(hours: number): "Full Day" | "Half Day" | "Short" {
    if (hours >= 6) return "Full Day";
    if (hours >= 3) return "Half Day";
    return "Short";
  }

  // Submit attendance request
  r.post("/attendance/submit", authMiddleware, async (req, res) => {
    const loginTime = String(req.body?.loginTime ?? "").trim();
    const logoutTime = String(req.body?.logoutTime ?? "").trim();
    const date = String(req.body?.date ?? "").trim();
    const lunchStartTime = req.body?.lunchStartTime ? String(req.body.lunchStartTime).trim() : undefined;
    const lunchEndTime = req.body?.lunchEndTime ? String(req.body.lunchEndTime).trim() : undefined;

    if (!loginTime || !logoutTime || !date) {
      res.status(400).json({ error: "Login time, logout time, and date required" });
      return;
    }
    if (!req.memberId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Check if date is in the past (only allow same day submission for non-admins)
    if (req.role !== "Admin") {
      const today = new Date().toISOString().split("T")[0];
      if (date !== today) {
        res.status(403).json({ error: "Employees can only submit attendance for today" });
        return;
      }
    }

    const hours = calculateWorkHours(loginTime, logoutTime, lunchStartTime, lunchEndTime);
    const status = getAttendanceStatus(hours);
    const id = randomUUID();

    // Check for existing record for this date and member
    const existing = await AttendanceRecord.findOne({ date, memberId: req.memberId }).lean();
    if (existing && existing.approvalStatus === "Approved") {
      res.status(403).json({ error: "Attendance already approved for this date" });
      return;
    }

    const data = {
      _id: id,
      date,
      memberId: req.memberId,
      loginTime,
      logoutTime,
      lunchStartTime,
      lunchEndTime,
      hours,
      status,
      approvalStatus: "Pending" as const,
      submittedAt: Date.now(),
      submittedBy: req.memberId,
    };

    if (req.role === "Admin") {
      // Auto-approve for admin submissions
      await AttendanceRecord.create({
        ...data,
        approvalStatus: "Approved",
        approvedAt: Date.now(),
        approvedBy: req.memberId,
      });
    } else {
      await AttendanceRecord.create(data);
    }

    res.status(201).json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Approve attendance request
  r.post("/attendance/:id/approve", authMiddleware, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const record = await AttendanceRecord.findById(id);
    if (!record) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    record.approvalStatus = "Approved";
    record.approvedAt = Date.now();
    record.approvedBy = req.memberId;
    await record.save();

    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Reject attendance request
  r.post("/attendance/:id/reject", authMiddleware, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const reason = String(req.body?.reason ?? "").trim();
    
    const record = await AttendanceRecord.findById(id);
    if (!record) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    record.approvalStatus = "Rejected";
    record.rejectionReason = reason || "";
    await record.save();

    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // ========== NEW TASK ENDPOINTS (ClickUp Features) ==========

  // Partial task update (for inline editing, toggles, etc.)
  r.patch("/tasks/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (!canAccessTask(task, viewerFromReq(req))) {
      res.status(403).json({ error: "Not authorized to update this task" });
      return;
    }
    if (req.role !== "Admin" && req.body.assignedTo != null) {
      res.status(403).json({ error: "Only admin can reassign tasks" });
      return;
    }

    // Update allowed fields
    if (req.body.title != null) task.title = String(req.body.title);
    if (req.body.description != null) task.description = String(req.body.description);
    if (req.body.assignedTo != null) {
      task.assignedTo = Array.isArray(req.body.assignedTo) ? req.body.assignedTo : [String(req.body.assignedTo)];
    }
    if (req.body.priority != null) task.priority = String(req.body.priority);
    if (req.body.status != null) task.status = String(req.body.status);
    if (req.body.deadline != null) task.deadline = String(req.body.deadline);
    if (req.body.project != null) task.project = String(req.body.project);
    if (req.body.tags != null) task.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    if (req.body.isFavorite != null) task.isFavorite = Boolean(req.body.isFavorite);
    if (req.body.isRecurring != null) task.isRecurring = Boolean(req.body.isRecurring);
    if (req.body.recurringPattern != null) task.recurringPattern = String(req.body.recurringPattern);
    if (req.body.dependencies != null) task.dependencies = Array.isArray(req.body.dependencies) ? req.body.dependencies : [];

    task.updatedAt = Date.now();
    if (req.body.status === "Completed") {
      task.completedAt = Date.now();
    }

    await task.save();
    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Add subtask
  r.post("/tasks/:id/subtasks", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const title = String(req.body?.title ?? "").trim();

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (!canAccessTask(task, viewerFromReq(req))) {
      res.status(403).json({ error: "Not authorized for this task" });
      return;
    }

    const taskDoc = task as any;
    if (!taskDoc.subtasks) taskDoc.subtasks = [];
    taskDoc.subtasks.push({
      _id: randomUUID(),
      title,
      completed: false,
      createdAt: Date.now(),
    });

    task.updatedAt = Date.now();
    await task.save();
    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Update subtask
  r.patch("/tasks/:id/subtasks/:subtaskId", authMiddleware, async (req, res) => {
    const { id, subtaskId } = req.params;

    const task = await Task.findById(id);
    if (!task || !task.subtasks) {
      res.status(404).json({ error: "Task or subtask not found" });
      return;
    }
    if (!canAccessTask(task, viewerFromReq(req))) {
      res.status(403).json({ error: "Not authorized for this task" });
      return;
    }

    const subtask = (task.subtasks as any[]).find(s => s._id === subtaskId);
    if (!subtask) {
      res.status(404).json({ error: "Subtask not found" });
      return;
    }

    if (req.body.title != null) subtask.title = String(req.body.title);
    if (req.body.completed != null) subtask.completed = Boolean(req.body.completed);

    task.updatedAt = Date.now();
    await task.save();
    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Delete subtask
  r.delete("/tasks/:id/subtasks/:subtaskId", authMiddleware, async (req, res) => {
    const { id, subtaskId } = req.params;

    const task = await Task.findById(id);
    if (!task || !task.subtasks) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (!canAccessTask(task, viewerFromReq(req))) {
      res.status(403).json({ error: "Not authorized for this task" });
      return;
    }

    const taskDoc = task as any;
    taskDoc.subtasks = (taskDoc.subtasks as any[]).filter((s) => s._id !== subtaskId);
    task.updatedAt = Date.now();
    await task.save();
    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Add checklist item
  r.post("/tasks/:id/checklist", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const text = String(req.body?.text ?? "").trim();

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (!canAccessTask(task, viewerFromReq(req))) {
      res.status(403).json({ error: "Not authorized for this task" });
      return;
    }

    const taskDoc = task as any;
    if (!taskDoc.checklist) taskDoc.checklist = [];
    taskDoc.checklist.push({
      _id: randomUUID(),
      text,
      completed: false,
    });

    task.updatedAt = Date.now();
    await task.save();
    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Update checklist item
  r.patch("/tasks/:id/checklist/:itemId", authMiddleware, async (req, res) => {
    const { id, itemId } = req.params;

    const task = await Task.findById(id);
    if (!task || !task.checklist) {
      res.status(404).json({ error: "Task or checklist not found" });
      return;
    }
    if (!canAccessTask(task, viewerFromReq(req))) {
      res.status(403).json({ error: "Not authorized for this task" });
      return;
    }

    const item = (task.checklist as any[]).find(i => i._id === itemId);
    if (!item) {
      res.status(404).json({ error: "Checklist item not found" });
      return;
    }

    if (req.body.text != null) item.text = String(req.body.text);
    if (req.body.completed != null) item.completed = Boolean(req.body.completed);

    task.updatedAt = Date.now();
    await task.save();
    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Delete checklist item
  r.delete("/tasks/:id/checklist/:itemId", authMiddleware, async (req, res) => {
    const { id, itemId } = req.params;

    const task = await Task.findById(id);
    if (!task || !task.checklist) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (!canAccessTask(task, viewerFromReq(req))) {
      res.status(403).json({ error: "Not authorized for this task" });
      return;
    }

    const taskDoc = task as any;
    taskDoc.checklist = (taskDoc.checklist as any[]).filter((i) => i._id !== itemId);
    task.updatedAt = Date.now();
    await task.save();
    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Time tracking - Start
  r.post("/tasks/:id/time/start", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (!canAccessTask(task, viewerFromReq(req))) {
      res.status(403).json({ error: "Not authorized for this task" });
      return;
    }

    // Store start time in temporary field (not persisted, just for current session)
    // In real ClickUp, this would be a separate timeEntry collection
    res.json({ ok: true, startedAt: Date.now() });
  });

  // Time tracking - Stop and add time spent
  r.post("/tasks/:id/time/stop", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const minutes = Number(req.body?.minutes ?? 0);

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (!canAccessTask(task, viewerFromReq(req))) {
      res.status(403).json({ error: "Not authorized for this task" });
      return;
    }

    task.timeSpent = (task.timeSpent ?? 0) + minutes;
    task.updatedAt = Date.now();
    await task.save();
    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Get activity feed (recent activities, role-scoped)
  r.get("/activity", authMiddleware, async (req, res) => {
    const query = req.role === "Admin" ? {} : { memberId: req.memberId };
    const activities = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.json(
      activities.map((a) => ({
        id: a._id,
        memberId: a.memberId,
        action: a.action,
        taskId: a.taskId ?? undefined,
        timestamp: a.timestamp,
        details: a.details ?? undefined,
      })),
    );
  });

  // Log activity helper (internal use)
  async function logActivity(memberId: string | undefined, action: string, taskId?: string, details?: string) {
    if (!memberId) return;
    await ActivityLog.create({
      _id: randomUUID(),
      memberId,
      action,
      taskId,
      timestamp: Date.now(),
      details,
    });
  }

  // ========== COMMENT ENDPOINTS ==========

  // Add comment to task
  r.post("/tasks/:id/comments", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const text = String(req.body?.text ?? "").trim();

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (!canAccessTask(task, viewerFromReq(req))) {
      res.status(403).json({ error: "Not authorized for this task" });
      return;
    }

    if (!text) {
      res.status(400).json({ error: "Comment text required" });
      return;
    }

    const taskDoc = task as any;
    if (!taskDoc.comments) taskDoc.comments = [];
    taskDoc.comments.push({
      _id: randomUUID(),
      memberId: req.memberId,
      text,
      createdAt: Date.now(),
    });

    task.updatedAt = Date.now();
    await task.save();
    
    // Log activity
    await logActivity(req.memberId, "Added comment", id, text.substring(0, 100));
    
    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Delete comment from task
  r.delete("/tasks/:id/comments/:commentId", authMiddleware, async (req, res) => {
    const { id, commentId } = req.params;

    const task = await Task.findById(id);
    if (!task || !task.comments) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (!canAccessTask(task, viewerFromReq(req))) {
      res.status(403).json({ error: "Not authorized for this task" });
      return;
    }

    const comment = (task.comments as any[]).find(c => c._id === commentId);
    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    // Only allow deleting own comments or if admin
    if (comment.memberId !== req.memberId && req.role !== "Admin") {
      res.status(403).json({ error: "Not authorized to delete this comment" });
      return;
    }

    const taskDoc = task as any;
    taskDoc.comments = (taskDoc.comments as any[]).filter((c) => c._id !== commentId);
    task.updatedAt = Date.now();
    await task.save();

    // Log activity
    await logActivity(req.memberId, "Deleted comment", id);

    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Send task message
  r.post("/tasks/:id/messages", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { text, isAdmin } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ error: "Message text required" });
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (!canAccessTask(task, viewerFromReq(req))) {
      res.status(403).json({ error: "Not authorized for this task" });
      return;
    }

    const messageId = randomUUID();
    const member = await Member.findById(req.memberId).lean();

    if (!task.messages) {
      (task as any).messages = [];
    }

    (task.messages as any[]).push({
      _id: messageId,
      taskId: id,
      senderId: req.memberId,
      senderRole: req.role,
      text: text.trim(),
      taskSnapshot: {
        title: task.title,
        status: task.status,
        priority: task.priority,
      },
      createdAt: Date.now(),
      isAdmin: isAdmin === true || req.role === "Admin",
    });

    task.updatedAt = Date.now();
    await task.save();

    // Log activity
    await logActivity(req.memberId, "Added task message", id);

    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Get daily status
  r.get("/daily-status/:memberId/:date", authMiddleware, async (req, res) => {
    const { memberId, date } = req.params;
    if (req.role !== "Admin" && memberId !== req.memberId) {
      res.status(403).json({ error: "Not authorized to view this daily status" });
      return;
    }

    const dailyStatus = await DailyStatus.findOne({
      memberId,
      date,
    }).lean();

    if (!dailyStatus) {
      res.status(404).json({ error: "Daily status not found" });
      return;
    }

    res.json({
      id: dailyStatus._id,
      memberId: dailyStatus.memberId,
      date: dailyStatus.date,
      completedToday: dailyStatus.completedToday,
      pendingTasks: dailyStatus.pendingTasks,
      notes: dailyStatus.notes,
      submittedAt: dailyStatus.submittedAt,
    });
  });

  // Submit daily status
  r.post("/daily-status", authMiddleware, async (req, res) => {
    const requestedMemberId = String(req.body?.memberId ?? "");
    const memberId = req.role === "Admin" ? requestedMemberId : req.memberId ?? "";
    const date = String(req.body?.date ?? "");
    const completedToday = String(req.body?.completedToday ?? "");
    const pendingTasks = Array.isArray(req.body?.pendingTasks) ? req.body.pendingTasks : [];
    const notes = req.body?.notes != null ? String(req.body.notes) : "";

    if (!memberId || !date || !completedToday) {
      res.status(400).json({ error: "memberId, date, and completedToday required" });
      return;
    }
    if (req.role !== "Admin" && memberId !== req.memberId) {
      res.status(403).json({ error: "Not authorized to submit for another member" });
      return;
    }

    const statusId = randomUUID();
    const existingStatus = await DailyStatus.findOne({ memberId, date });

    if (existingStatus) {
      existingStatus.completedToday = completedToday;
      existingStatus.pendingTasks = pendingTasks || [];
      existingStatus.notes = notes;
      existingStatus.submittedAt = Date.now();
      await existingStatus.save();
    } else {
      await DailyStatus.create({
        _id: statusId,
        memberId,
        date,
        completedToday,
        pendingTasks: pendingTasks || [],
        notes,
        submittedAt: Date.now(),
      });
    }

    // Log activity
    await logActivity(req.memberId, "Submitted daily status", undefined);

    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Review task completion
  r.post("/tasks/:id/review", authMiddleware, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    if (status === "rejected") {
      // Move task back to In Progress if rejected
      task.status = "In Progress";
    }

    if (!task.review) {
      (task as any).review = {};
    }

    (task.review as any).status = status;
    (task.review as any).rejectionReason = rejectionReason || null;
    (task.review as any).reviewedBy = req.memberId;
    (task.review as any).reviewedAt = Date.now();

    task.updatedAt = Date.now();
    await task.save();

    // Log activity
    await logActivity(req.memberId, `${status === "approved" ? "Approved" : "Rejected"} task completion`, id);

    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Get pending reviews
  r.get("/tasks/reviews/pending", authMiddleware, requireAdmin, async (req, res) => {
    const tasks = await Task.find({
      status: "Completed",
      $or: [
        { review: { $exists: false } },
        { "review.status": "pending" },
      ],
    }).lean();

    const result = tasks.map((t) => ({
      id: t._id,
      title: t.title,
      description: t.description,
      assignedTo: Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo],
      deadline: t.deadline,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    res.json(result);
  });

  return r;
}
