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

async function bootstrapPayload() {
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

  return {
    members: members.map((m) => ({
      id: m._id,
      name: m.name,
      role: m.role as "Admin" | "Employee" | "Intern",
      avatarSeed: m.avatarSeed ?? undefined,
    })),
    users: users.map((u) => ({
      id: u._id,
      memberId: u.memberId,
      username: u.username,
      password: "",
    })),
    pendingUsers: pendingUsers.map((p) => ({
      id: p._id,
      name: p.name,
      username: p.username,
      password: "",
      role: p.role as "Admin" | "Employee" | "Intern",
      createdAt: p.createdAt,
    })),
    attendance: attendance.map((a) => ({
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
    tasks: tasks.map((t) => ({
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
    dailyStatuses: dailyStatuses.map((d: any) => ({
      id: d._id,
      memberId: d.memberId,
      date: d.date,
      completedToday: d.completedToday,
      pendingTasks: d.pendingTasks ?? [],
      notes: d.notes ?? undefined,
      submittedAt: d.submittedAt,
    })),
    holidays: holidays.map((h) => ({ id: h._id, date: h.date, reason: h.reason })),
    reports: workReports.map((r) => ({
      id: r._id,
      date: r.date,
      memberId: r.memberId,
      assigned: r.assigned,
      completed: r.completed,
      pending: r.pending,
      delivery: r.delivery as "Done" | "Not Done",
    })),
    userNotifications: userNotifications.map((n) => ({
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
        avatarSeed: member.avatarSeed ?? undefined,
      },
    });
  });

  r.post("/auth/register", async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const username = String(req.body?.username ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    const role = String(req.body?.role ?? "Intern");
    if (!name || !username || !password) {
      res.status(400).json({ error: "All fields required" });
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
    const id = randomUUID();
    const passwordHash = await hashPassword(password);
    await PendingUser.create({
      _id: id,
      name,
      username,
      passwordHash,
      role,
      createdAt: Date.now(),
    });
    res.status(201).json({ ok: true });
  });

  r.get("/bootstrap", authMiddleware, async (_req, res) => {
    res.json(await bootstrapPayload());
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
        passwordHash: pending.passwordHash,
      });
      await PendingUser.deleteOne({ _id: id });
    } catch (e) {
      await Member.deleteOne({ _id: memberId }).catch(() => {});
      await User.deleteOne({ _id: userId }).catch(() => {});
      throw e;
    }
    res.json(await bootstrapPayload());
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
    await Task.deleteMany({});
    if (req.body.length > 0) {
      await Task.insertMany(
        (req.body as Record<string, unknown>[]).map((t) => ({
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
          subtasks: Array.isArray(t.subtasks) ? (t.subtasks as any[]).map(s => ({
            _id: String(s.id),
            title: String(s.title),
            completed: Boolean(s.completed),
            createdAt: Number(s.createdAt),
          })) : undefined,
          checklist: Array.isArray(t.checklist) ? (t.checklist as any[]).map(c => ({
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
          reminders: Array.isArray(t.reminders) ? (t.reminders as any[]).map(r => ({
            _id: String(r.id),
            date: String(r.date),
            time: String(r.time),
          })) : undefined,
          comments: Array.isArray(t.comments) ? (t.comments as any[]).map(c => ({
            _id: String(c.id),
            memberId: String(c.memberId),
            text: String(c.text),
            createdAt: Number(c.createdAt),
            updatedAt: c.updatedAt ? Number(c.updatedAt) : undefined,
          })) : undefined,
        })),
      );
    }
    res.json({ ok: true });
  });

  r.put("/attendance", authMiddleware, async (req, res) => {
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

  r.put("/reports", authMiddleware, async (req, res) => {
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

  r.put("/notifications", authMiddleware, async (req, res) => {
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

    res.status(201).json(await bootstrapPayload());
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

    res.json(await bootstrapPayload());
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

    res.json(await bootstrapPayload());
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
    res.json(await bootstrapPayload());
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
    res.json(await bootstrapPayload());
  });

  // Update subtask
  r.patch("/tasks/:id/subtasks/:subtaskId", authMiddleware, async (req, res) => {
    const { id, subtaskId } = req.params;

    const task = await Task.findById(id);
    if (!task || !task.subtasks) {
      res.status(404).json({ error: "Task or subtask not found" });
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
    res.json(await bootstrapPayload());
  });

  // Delete subtask
  r.delete("/tasks/:id/subtasks/:subtaskId", authMiddleware, async (req, res) => {
    const { id, subtaskId } = req.params;

    const task = await Task.findById(id);
    if (!task || !task.subtasks) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const taskDoc = task as any;
    taskDoc.subtasks = (taskDoc.subtasks as any[]).filter((s) => s._id !== subtaskId);
    task.updatedAt = Date.now();
    await task.save();
    res.json(await bootstrapPayload());
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

    const taskDoc = task as any;
    if (!taskDoc.checklist) taskDoc.checklist = [];
    taskDoc.checklist.push({
      _id: randomUUID(),
      text,
      completed: false,
    });

    task.updatedAt = Date.now();
    await task.save();
    res.json(await bootstrapPayload());
  });

  // Update checklist item
  r.patch("/tasks/:id/checklist/:itemId", authMiddleware, async (req, res) => {
    const { id, itemId } = req.params;

    const task = await Task.findById(id);
    if (!task || !task.checklist) {
      res.status(404).json({ error: "Task or checklist not found" });
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
    res.json(await bootstrapPayload());
  });

  // Delete checklist item
  r.delete("/tasks/:id/checklist/:itemId", authMiddleware, async (req, res) => {
    const { id, itemId } = req.params;

    const task = await Task.findById(id);
    if (!task || !task.checklist) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const taskDoc = task as any;
    taskDoc.checklist = (taskDoc.checklist as any[]).filter((i) => i._id !== itemId);
    task.updatedAt = Date.now();
    await task.save();
    res.json(await bootstrapPayload());
  });

  // Time tracking - Start
  r.post("/tasks/:id/time/start", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
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

    task.timeSpent = (task.timeSpent ?? 0) + minutes;
    task.updatedAt = Date.now();
    await task.save();
    res.json(await bootstrapPayload());
  });

  // Get activity feed (last 100 activities)
  r.get("/activity", authMiddleware, async (req, res) => {
    const activities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(100)
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
    
    res.json(await bootstrapPayload());
  });

  // Delete comment from task
  r.delete("/tasks/:id/comments/:commentId", authMiddleware, async (req, res) => {
    const { id, commentId } = req.params;

    const task = await Task.findById(id);
    if (!task || !task.comments) {
      res.status(404).json({ error: "Task not found" });
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

    res.json(await bootstrapPayload());
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

    res.json(await bootstrapPayload());
  });

  // Get daily status
  r.get("/daily-status/:memberId/:date", authMiddleware, async (req, res) => {
    const { memberId, date } = req.params;

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
    const { memberId, date, completedToday, pendingTasks, notes } = req.body;

    if (!memberId || !date || !completedToday) {
      res.status(400).json({ error: "memberId, date, and completedToday required" });
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

    res.json(await bootstrapPayload());
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

    if (status === "rejected" && !task.status) {
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

    res.json(await bootstrapPayload());
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
