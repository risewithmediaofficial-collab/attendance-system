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
      hours: a.hours,
      status: a.status as "Full Day" | "Half Day" | "Short",
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
          hours: Number(a.hours),
          status: String(a.status),
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

  return r;
}
