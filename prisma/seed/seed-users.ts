import "dotenv/config";
import { Temporal } from "@js-temporal/polyfill";
import postgres from "@prisma/orm-postgres/runtime";

import type { Contract } from "../../prisma/contract.d";
import contractJson from "../../prisma/contract.json" with {
  type: "json",
};

(globalThis as typeof globalThis & {
  Temporal: typeof Temporal;
}).Temporal = Temporal;

const db = postgres<Contract>({
  contractJson,
  url: process.env.DATABASE_URL!,
});

const now = Temporal.Now.instant();

async function main() {
  const ownerId = "user-owner-veerjis";
  const counterId = "user-counter-veerjis";

  const existingUsers =
    await db.orm.public.User.all();

  const ownerExists = existingUsers.some(
    (user) => user.id === ownerId
  );

  const counterExists = existingUsers.some(
    (user) => user.id === counterId
  );

  if (!ownerExists) {
    await db.orm.public.User.create({
      id: ownerId,
      name: "VeerJi Owner",
      phone: "9000000001",
      role: "OWNER",
      createdAt: now,
      updatedAt: now,
    });

    console.log("✅ Owner created");
  } else {
    console.log("ℹ️ Owner already exists");
  }

  if (!counterExists) {
    await db.orm.public.User.create({
      id: counterId,
      name: "Counter Operator",
      phone: "9000000002",
      role: "COUNTER_OPERATOR",
      createdAt: now,
      updatedAt: now,
    });

    console.log("✅ Counter operator created");
  } else {
    console.log("ℹ️ Counter operator already exists");
  }

  const users = await db.orm.public.User.all();

  console.log("\n👥 USERS:");

  for (const user of users) {
    console.log(
      `- ${user.name} | ${user.phone} | ${user.role}`
    );
  }

  await db.close();
}

main().catch(async (error) => {
  console.error("❌ User seed failed:", error);
  await db.close();
  process.exit(1);
});