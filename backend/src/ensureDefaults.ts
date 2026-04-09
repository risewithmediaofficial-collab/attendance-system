import { randomUUID } from "node:crypto";
import { hashPassword } from "./auth.js";
import { Member, User } from "./models.js";

export async function ensureDefaultUsers(): Promise<void> {
  const defaults = [
    {
      username: "admin",
      password: "admin123",
      memberName: "System Admin",
      role: "Admin",
      avatarSeed: "admin",
    },
    {
      username: "employee",
      password: "employee123",
      memberName: "Employee (Jane)",
      role: "Employee",
      avatarSeed: "emp",
    },
    {
      username: "intern",
      password: "intern123",
      memberName: "Intern (Mike)",
      role: "Intern",
      avatarSeed: "intern",
    },
  ] as const;

  for (const def of defaults) {
    const existingUser = await User.findOne({ username: def.username }).lean();
    if (existingUser) {
      continue;
    }

    const memberId = randomUUID();
    const passwordHash = await hashPassword(def.password);

    await Member.create({
      _id: memberId,
      name: def.memberName,
      role: def.role,
      avatarSeed: def.avatarSeed,
    });

    await User.create({
      _id: randomUUID(),
      memberId,
      username: def.username,
      passwordHash,
    });
  }
}
