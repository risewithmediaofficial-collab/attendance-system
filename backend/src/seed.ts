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
  const internIds = Array.from({ length: 5 }, () => randomUUID());

  await Member.insertMany([
    { _id: adminMemberId, name: "Dinesh", role: "Admin", avatarSeed: "dinesh" },
    { _id: internIds[0], name: "Intern 1", role: "Intern", avatarSeed: "intern1" },
    { _id: internIds[1], name: "Intern 2", role: "Intern", avatarSeed: "intern2" },
    { _id: internIds[2], name: "Intern 3", role: "Intern", avatarSeed: "intern3" },
    { _id: internIds[3], name: "Intern 4", role: "Intern", avatarSeed: "intern4" },
    { _id: internIds[4], name: "Intern 5", role: "Intern", avatarSeed: "intern5" },
  ]);

  const adminHash = await bcrypt.hash("admin123", 10);

  await User.insertMany([
    { _id: randomUUID(), memberId: adminMemberId, username: "dinesh", passwordHash: adminHash },
  ]);

  // Create sample tasks for interns
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const taskDeadlines = [
    today.toISOString().split('T')[0],
    tomorrow.toISOString().split('T')[0],
    nextWeek.toISOString().split('T')[0],
  ];

  const sampleTasks = [
    { title: "Complete project proposal", description: "Draft and submit project proposal document", priority: "High", deadline: taskDeadlines[0], assignedTo: internIds[0], status: "Assigned", comments: [
      { _id: randomUUID(), memberId: adminMemberId, text: "Please ensure all requirements are included", createdAt: new Date() },
    ]},
    { title: "Review code changes", description: "Review and approve pending code changes from team", priority: "Medium", deadline: taskDeadlines[1], assignedTo: internIds[1], status: "In Progress", comments: [
      { _id: randomUUID(), memberId: internIds[1], text: "I've started the review", createdAt: new Date() },
      { _id: randomUUID(), memberId: adminMemberId, text: "Great, keep us updated", createdAt: new Date() },
    ]},
    { title: "Update documentation", description: "Update API documentation with new endpoints", priority: "Low", deadline: taskDeadlines[2], assignedTo: internIds[2], status: "Assigned" },
    { title: "Fix login bug", description: "Debug and fix the authentication issue reported", priority: "High", deadline: taskDeadlines[0], assignedTo: internIds[3], status: "In Progress", comments: [
      { _id: randomUUID(), memberId: internIds[3], text: "Found the issue in the auth middleware", createdAt: new Date() },
    ]},
    { title: "Design new dashboard", description: "Create mockups for the new dashboard layout", priority: "Medium", deadline: taskDeadlines[1], assignedTo: internIds[4], status: "Assigned" },
    { title: "Write unit tests", description: "Write tests for the new utility functions", priority: "Medium", deadline: taskDeadlines[2], assignedTo: internIds[0], status: "Assigned" },
    { title: "Deploy to staging", description: "Deploy latest changes to staging environment", priority: "High", deadline: taskDeadlines[0], assignedTo: internIds[1], status: "Completed", comments: [
      { _id: randomUUID(), memberId: internIds[1], text: "Deployment completed successfully", createdAt: new Date() },
      { _id: randomUUID(), memberId: adminMemberId, text: "Excellent work! Running final checks", createdAt: new Date() },
    ]},
  ];

  await Task.insertMany(
    sampleTasks.map((task) => ({
      _id: randomUUID(),
      ...task,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: task.status === "Completed" ? new Date() : undefined,
    }))
  );

  console.log("Seeded members + users (dinesh / 5 interns) + 7 sample tasks.");
  await disconnectMongo();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
