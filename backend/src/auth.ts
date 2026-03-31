import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Member, User } from "./models.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      memberId?: string;
      role?: string;
    }
  }
}

export type AuthPayload = { sub: string };

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AuthPayload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type AuthedRequest = Request;

export async function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { sub: userId } = verifyToken(token);
    const user = await User.findById(userId).lean();
    if (!user) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }
    const member = await Member.findById(user.memberId).lean();
    if (!member) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }
    req.userId = user._id;
    req.memberId = user.memberId;
    req.role = member.role;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.role !== "Admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}
