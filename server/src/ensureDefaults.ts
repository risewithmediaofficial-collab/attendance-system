import { randomUUID } from "node:crypto";
import { hashPassword } from "./auth.js";
import { Member, User } from "./models.js";

export async function ensureDefaultUsers(): Promise<void> {
  const [memberCount, userCount] = await Promise.all([Member.countDocuments(), User.countDocuments()]);
  if (memberCount > 0 || userCount > 0) return;

  const adminMemberId = randomUUID();
  const employeeMemberId = randomUUID();
  const internMemberId = randomUUID();

  await Member.insertMany([
    { _id: adminMemberId, name: "System Admin", role: "Admin", avatarSeed: "admin" },
    { _id: employeeMemberId, name: "Employee (Jane)", role: "Employee", avatarSeed: "emp" },
    { _id: internMemberId, name: "Intern (Mike)", role: "Intern", avatarSeed: "intern" },
  ]);

  const [adminHash, employeeHash, internHash] = await Promise.all([
    hashPassword("admin123"),
    hashPassword("employee123"),
    hashPassword("intern123"),
  ]);

  await User.insertMany([
    { _id: randomUUID(), memberId: adminMemberId, username: "admin", passwordHash: adminHash },
    { _id: randomUUID(), memberId: employeeMemberId, username: "employee", passwordHash: employeeHash },
    { _id: randomUUID(), memberId: internMemberId, username: "intern", passwordHash: internHash },
  ]);
}
