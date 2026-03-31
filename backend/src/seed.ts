import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { connectMongo, disconnectMongo } from "./db.js";
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

async function main() {
  await connectMongo();

  await Promise.all([
    Member.deleteMany({}),
    User.deleteMany({}),
    PendingUser.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    Task.deleteMany({}),
    Holiday.deleteMany({}),
    WorkReport.deleteMany({}),
    UserNotification.deleteMany({}),
  ]);

  const adminMemberId = randomUUID();
  const employeeMemberId = randomUUID();
  const internMemberId = randomUUID();

  await Member.insertMany([
    { _id: adminMemberId, name: "System Admin", role: "Admin", avatarSeed: "admin" },
    { _id: employeeMemberId, name: "Employee (Jane)", role: "Employee", avatarSeed: "emp" },
    { _id: internMemberId, name: "Intern (Mike)", role: "Intern", avatarSeed: "intern" },
  ]);

  const [adminHash, empHash, internHash] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("employee123", 10),
    bcrypt.hash("intern123", 10),
  ]);

  await User.insertMany([
    { _id: randomUUID(), memberId: adminMemberId, username: "admin", passwordHash: adminHash },
    { _id: randomUUID(), memberId: employeeMemberId, username: "employee", passwordHash: empHash },
    { _id: randomUUID(), memberId: internMemberId, username: "intern", passwordHash: internHash },
  ]);

  console.log("Seeded members + users (admin / employee / intern).");
  await disconnectMongo();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
