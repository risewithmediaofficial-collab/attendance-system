import { randomUUID } from "node:crypto";
import type { Router } from "express";
import { Router as createRouter } from "express";
import {
  AttendanceRecord,
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
  const [members, users, pendingUsers, attendance, tasks, holidays, workReports, userNotifications] =
    await Promise.all([
      Member.find().lean(),
      User.find().lean(),
      PendingUser.find().sort({ createdAt: -1 }).lean(),
      AttendanceRecord.find().lean(),
      Task.find().lean(),
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
      assignedTo: t.assignedTo,
      deadline: t.deadline,
      priority: t.priority as "Low" | "Medium" | "High",
      status: t.status as "Assigned" | "In Progress" | "Completed",
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      completedAt: t.completedAt ?? undefined,
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
          assignedTo: String(t.assignedTo),
          deadline: String(t.deadline),
          priority: String(t.priority),
          status: String(t.status),
          createdAt: Number(t.createdAt),
          updatedAt: Number(t.updatedAt),
          completedAt: t.completedAt != null ? Number(t.completedAt) : undefined,
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

  return r;
}
