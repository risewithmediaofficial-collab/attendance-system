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
    try {
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
    } catch (error) {
      console.error("Verify email error:", error);
      res.status(500).json({ success: false, error: "Failed to verify email" });
    }
  });

  r.get("/auth/check-email-status", authMiddleware, async (req, res) => {
    try {
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
    } catch (error) {
      console.error("Check email status error:", error);
      res.status(500).json({ success: false, error: "Failed to check email status" });
    }
  });

  r.post("/auth/update-email", authMiddleware, async (req, res) => {
    try {
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
    } catch (error) {
      console.error("Update email error:", error);
      res.status(500).json({ success: false, error: "Failed to update email" });
    }
  });

  r.post("/auth/send-verification", authMiddleware, async (req, res) => {
    try {
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
    } catch (error) {
      console.error("Send verification error:", error);
      res.status(500).json({ success: false, error: "Failed to send verification email" });
    }
  });

  r.post("/auth/forgot-password", async (req, res) => {
    try {
      const email = normalizeEmail(String(req.body?.email ?? ""));
      if (!email || !email.includes("@") || !email.includes(".")) {
        res.status(400).json({ success: false, error: "Valid email address is required" });
        return;
      }

      const user = await User.findOne({ email }).lean();
      if (!user) {
        // Do not reveal whether the email exists.
        res.json({
          success: true,
          message: "If an account with that email exists, a password reset link has been sent.",
        });
        return;
      }

      const { token, hashedToken } = emailService.generateToken();
      const resetExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: resetExpiry,
          },
        },
      );

      const sendResult = await emailService.sendPasswordReset(email, token);
      if (!sendResult.success) {
        res.status(500).json({
          success: false,
          error: sendResult.error ?? "Failed to send password reset email",
        });
        return;
      }

      res.json({
        success: true,
        message: "Password reset link sent to your email.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ success: false, error: "Failed to process request" });
    }
  });

  r.post("/auth/reset-password", async (req, res) => {
    try {
      const token = String(req.body?.token ?? "").trim();
      const newPassword = String(req.body?.newPassword ?? "");

      if (!token || !newPassword) {
        res.status(400).json({ success: false, error: "Reset token and new password are required" });
        return;
      }
      if (newPassword.length < 8) {
        res.status(400).json({ success: false, error: "Password must be at least 8 characters long" });
        return;
      }

      const hashedToken = emailService.hashToken(token);
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      }).lean();

      if (!user) {
        res.status(400).json({ success: false, error: "Invalid or expired reset token" });
        return;
      }

      const passwordHash = await hashPassword(newPassword);
      await User.updateOne(
        { _id: user._id },
        {
          $set: { passwordHash },
          $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
        },
      );

      res.json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ success: false, error: "Failed to reset password" });
    }
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

  const attendanceStatuses = new Set<"Full Day" | "Half Day" | "Short">([
    "Full Day",
    "Half Day",
    "Short",
  ]);

  function isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  function isValidIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function toMinutes(value: string): number {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function isSundayHoliday(date: string): boolean {
    const parsed = new Date(`${date}T00:00:00`);
    return !Number.isNaN(parsed.getTime()) && parsed.getDay() === 0;
  }

  async function isHolidayDate(date: string): Promise<boolean> {
    if (isSundayHoliday(date)) return true;
    const existingHoliday = await Holiday.findOne({ date }).lean();
    return !!existingHoliday;
  }

  function parseAttendanceInput(body: Record<string, unknown>) {
    const memberId = String(body.memberId ?? "").trim();
    const date = String(body.date ?? "").trim();
    const loginTime = String(body.loginTime ?? "").trim();
    const logoutTime = String(body.logoutTime ?? "").trim();
    const lunchStartTime = body.lunchStartTime ? String(body.lunchStartTime).trim() : undefined;
    const lunchEndTime = body.lunchEndTime ? String(body.lunchEndTime).trim() : undefined;
    const requestedStatus = body.status != null ? String(body.status).trim() : "";

    if (!memberId || !date || !loginTime || !logoutTime) {
      return { error: "Member, date, login time, and logout time are required" } as const;
    }
    if (!isValidIsoDate(date)) {
      return { error: "Date must be in YYYY-MM-DD format" } as const;
    }
    if (!isValidTime(loginTime) || !isValidTime(logoutTime)) {
      return { error: "Login and logout time must be in HH:MM format" } as const;
    }
    if ((lunchStartTime && !lunchEndTime) || (!lunchStartTime && lunchEndTime)) {
      return { error: "Both lunch start and lunch end time are required together" } as const;
    }
    if (lunchStartTime && lunchEndTime && (!isValidTime(lunchStartTime) || !isValidTime(lunchEndTime))) {
      return { error: "Lunch time must be in HH:MM format" } as const;
    }

    const loginMinutes = toMinutes(loginTime);
    const logoutMinutes = toMinutes(logoutTime);
    if (logoutMinutes <= loginMinutes) {
      return { error: "Logout time must be after login time" } as const;
    }

    if (lunchStartTime && lunchEndTime) {
      const lunchStartMinutes = toMinutes(lunchStartTime);
      const lunchEndMinutes = toMinutes(lunchEndTime);
      if (lunchEndMinutes <= lunchStartMinutes) {
        return { error: "Lunch end time must be after lunch start time" } as const;
      }
      if (lunchStartMinutes < loginMinutes || lunchEndMinutes > logoutMinutes) {
        return { error: "Lunch time must be within login and logout time" } as const;
      }
    }

    const hours = calculateWorkHours(loginTime, logoutTime, lunchStartTime, lunchEndTime);
    const computedStatus = getAttendanceStatus(hours);
    const status =
      requestedStatus && attendanceStatuses.has(requestedStatus as "Full Day" | "Half Day" | "Short")
        ? (requestedStatus as "Full Day" | "Half Day" | "Short")
        : computedStatus;

    return {
      value: {
        memberId,
        date,
        loginTime,
        logoutTime,
        lunchStartTime,
        lunchEndTime,
        hours,
        status,
      },
    } as const;
  }

  // Submit attendance request
  r.post("/attendance/submit", authMiddleware, async (req, res) => {
    if (!req.memberId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = parseAttendanceInput({
      ...req.body,
      memberId: req.memberId,
      status: undefined,
    });
    if ("error" in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const { memberId, date, loginTime, logoutTime, lunchStartTime, lunchEndTime, hours, status } = parsed.value;

    if (await isHolidayDate(date)) {
      res.status(403).json({ error: "Attendance cannot be submitted on holidays" });
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

    const existing = await AttendanceRecord.findOne({ date, memberId }).lean();

    const baseData = {
      date,
      memberId,
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
      const adminData = {
        ...baseData,
        approvalStatus: "Approved" as const,
        approvedAt: Date.now(),
        approvedBy: req.memberId,
        rejectionReason: undefined,
      };
      if (existing) {
        await AttendanceRecord.updateOne({ _id: existing._id }, adminData);
      } else {
        await AttendanceRecord.create({
          _id: randomUUID(),
          ...adminData,
        });
      }
    } else {
      if (existing?.approvalStatus === "Approved") {
        res.status(403).json({ error: "Attendance already approved for this date" });
        return;
      }

      const userData = {
        ...baseData,
        approvedAt: undefined,
        approvedBy: undefined,
        rejectionReason: undefined,
      };

      if (existing) {
        await AttendanceRecord.updateOne(
          { _id: existing._id },
          {
            ...userData,
            approvalStatus: "Pending",
          },
        );
      } else {
        await AttendanceRecord.create({
          _id: randomUUID(),
          ...userData,
        });
      }
    }

    res.status(201).json(await bootstrapPayload(viewerFromReq(req)));
  });

  r.post("/attendance/admin", authMiddleware, requireAdmin, async (req, res) => {
    if (!req.memberId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = parseAttendanceInput(req.body as Record<string, unknown>);
    if ("error" in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const { memberId, date, loginTime, logoutTime, lunchStartTime, lunchEndTime, hours, status } = parsed.value;
    if (await isHolidayDate(date)) {
      res.status(403).json({ error: "Attendance cannot be created on holidays" });
      return;
    }
    const memberExists = await Member.findById(memberId).lean();
    if (!memberExists) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    const duplicate = await AttendanceRecord.findOne({ memberId, date }).lean();
    if (duplicate) {
      res.status(409).json({ error: "Attendance already exists for this employee on this date" });
      return;
    }

    await AttendanceRecord.create({
      _id: randomUUID(),
      memberId,
      date,
      loginTime,
      logoutTime,
      lunchStartTime,
      lunchEndTime,
      hours,
      status,
      approvalStatus: "Approved",
      submittedAt: Date.now(),
      submittedBy: req.memberId,
      approvedAt: Date.now(),
      approvedBy: req.memberId,
    });

    res.status(201).json(await bootstrapPayload(viewerFromReq(req)));
  });

  r.patch("/attendance/:id", authMiddleware, requireAdmin, async (req, res) => {
    if (!req.memberId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const record = await AttendanceRecord.findById(id);
    if (!record) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    const parsed = parseAttendanceInput(req.body as Record<string, unknown>);
    if ("error" in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const { memberId, date, loginTime, logoutTime, lunchStartTime, lunchEndTime, hours, status } = parsed.value;
    if (await isHolidayDate(date)) {
      res.status(403).json({ error: "Attendance cannot be updated to a holiday" });
      return;
    }
    const memberExists = await Member.findById(memberId).lean();
    if (!memberExists) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    const duplicate = await AttendanceRecord.findOne({
      memberId,
      date,
      _id: { $ne: id },
    }).lean();
    if (duplicate) {
      res.status(409).json({ error: "Attendance already exists for this employee on this date" });
      return;
    }

    record.memberId = memberId;
    record.date = date;
    record.loginTime = loginTime;
    record.logoutTime = logoutTime;
    record.lunchStartTime = lunchStartTime;
    record.lunchEndTime = lunchEndTime;
    record.hours = hours;
    record.status = status;
    record.approvalStatus = "Approved";
    record.rejectionReason = undefined;
    record.submittedAt = record.submittedAt ?? Date.now();
    record.submittedBy = record.submittedBy ?? req.memberId;
    record.approvedAt = Date.now();
    record.approvedBy = req.memberId;
    await record.save();

    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  r.delete("/attendance/:id", authMiddleware, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const deleted = await AttendanceRecord.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    res.json(await bootstrapPayload(viewerFromReq(req)));
  });

  // Approve attendance request
  r.post("/attendance/:id/approve", authMiddleware, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const record = await AttendanceRecord.findById(id);
    if (!record) {
      res.status(404).json({ error: "Attendance record not found" });
      return;
    }

    const duplicateApproved = await AttendanceRecord.findOne({
      _id: { $ne: id },
      memberId: record.memberId,
      date: record.date,
      approvalStatus: "Approved",
    }).lean();
    if (duplicateApproved) {
      res.status(409).json({ error: "Another approved attendance record already exists for this employee on this date" });
      return;
    }

    record.approvalStatus = "Approved";
    record.approvedAt = Date.now();
    record.approvedBy = req.memberId;
    record.rejectionReason = undefined;
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

    if (req.role === "Admin") {
      const targetMemberIds = assigneeIds(task.assignedTo).filter((memberId) => memberId && memberId !== req.memberId);

      if (targetMemberIds.length > 0) {
        const author = await Member.findById(req.memberId).lean();
        const preview = text.length > 120 ? `${text.slice(0, 117)}...` : text;

        await UserNotification.create({
          _id: randomUUID(),
          title: `New comment on ${task.title}`,
          message: `${author?.name ?? "Admin"} added a comment: ${preview}`,
          targetMemberIds,
          createdAt: Date.now(),
          createdBy: req.memberId,
        });
      }
    }
    
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

  // ========== ATTENDANCE SETTINGS ENDPOINTS ==========

  // Get attendance settings (admin only)
  r.get("/attendance/settings", authMiddleware, requireAdmin, async (req, res) => {
    try {
      // Import dynamically to avoid circular dependencies
      const { AttendanceSettingsService } = await import("./services/attendanceSettings.service.js");
      const settingsService = new AttendanceSettingsService();
      const result = await settingsService.getSettings();
      
      if (result.success) {
        res.json(result.data);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch settings" });
    }
  });

  // Update attendance date range settings (admin only)
  r.post("/attendance/settings/date-range", authMiddleware, requireAdmin, async (req, res) => {
    const { startDate, endDate, calculationMode, lastNDays, presentDaysRequired } = req.body;
    const normalizedMode = calculationMode === "last-n-days" ? "last-n-days" : "date-range";
    const parsedLastNDays = Number(lastNDays);

    if (normalizedMode === "date-range") {
      if (!startDate || !endDate) {
        res.status(400).json({ error: "Start date and end date are required" });
        return;
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        res.status(400).json({ error: "Dates must be in YYYY-MM-DD format" });
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        res.status(400).json({ error: "Start date must be before end date" });
        return;
      }
    } else if (!Number.isInteger(parsedLastNDays) || parsedLastNDays < 1 || parsedLastNDays > 365) {
      res.status(400).json({ error: "Last N Days must be a whole number between 1 and 365" });
      return;
    }

    try {
      const { AttendanceSettingsService } = await import("./services/attendanceSettings.service.js");
      const settingsService = new AttendanceSettingsService();
      const result = await settingsService.updateDateRangeSettings(
        normalizedMode === "date-range" ? startDate : undefined,
        normalizedMode === "date-range" ? endDate : undefined,
        normalizedMode,
        normalizedMode === "last-n-days" ? parsedLastNDays : undefined,
        presentDaysRequired
      );

      if (result.success) {
        res.json(result.data);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update settings" });
    }
  });

  // Get attendance percentage for a member (admin only)
  r.get("/attendance/percentage/:memberId", authMiddleware, requireAdmin, async (req, res) => {
    const { memberId } = req.params;

    if (!memberId) {
      res.status(400).json({ error: "Member ID is required" });
      return;
    }

    try {
      const { AttendanceSettingsService } = await import("./services/attendanceSettings.service.js");
      const settingsService = new AttendanceSettingsService();
      const result = await settingsService.calculateAttendancePercentage(memberId);

      if (result.success) {
        res.json(result.data);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to calculate percentage" });
    }
  });

  // Get attendance percentage for all members (admin only)
  r.get("/attendance/percentage", authMiddleware, requireAdmin, async (req, res) => {
    try {
      const { AttendanceSettingsService } = await import("./services/attendanceSettings.service.js");
      const settingsService = new AttendanceSettingsService();
      const result = await settingsService.calculateAllMembersAttendancePercentage();

      if (result.success) {
        res.json(result.data);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to calculate percentages" });
    }
  });

  // Reset attendance settings to default (admin only)
  r.post("/attendance/settings/reset", authMiddleware, requireAdmin, async (req, res) => {
    try {
      const { AttendanceSettingsService } = await import("./services/attendanceSettings.service.js");
      const settingsService = new AttendanceSettingsService();
      const result = await settingsService.resetSettings();

      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to reset settings" });
    }
  });

  // Update office hours and lunch time (admin only)
  r.post("/attendance/settings/office-hours", authMiddleware, requireAdmin, async (req, res) => {
    const { officeStartTime, officeEndTime, lunchStartTime, lunchEndTime } = req.body;

    // Validate input
    if (!officeStartTime || !officeEndTime || !lunchStartTime || !lunchEndTime) {
      res.status(400).json({ error: "All office hours fields are required" });
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(officeStartTime) || !timeRegex.test(officeEndTime) || 
        !timeRegex.test(lunchStartTime) || !timeRegex.test(lunchEndTime)) {
      res.status(400).json({ error: "Times must be in HH:MM format" });
      return;
    }

    try {
      const { AttendanceSettingsService } = await import("./services/attendanceSettings.service.js");
      const settingsService = new AttendanceSettingsService();
      const result = await settingsService.updateOfficeHours(
        officeStartTime,
        officeEndTime,
        lunchStartTime,
        lunchEndTime
      );

      if (result.success) {
        res.json(result.data);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update office hours" });
    }
  });

  return r;
}
