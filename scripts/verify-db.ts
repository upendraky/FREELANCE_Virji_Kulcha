import { Temporal } from "@js-temporal/polyfill";
(globalThis as typeof globalThis & { Temporal: typeof Temporal }).Temporal = Temporal;

import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../prisma/contract.d";
import contractJson from "../prisma/contract.json" with { type: "json" };

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

const db = postgres<Contract>({
  contractJson,
  url: process.env.DATABASE_URL,
});

async function verify() {
  const restaurants = await db.orm.public.Restaurant.all();
  const tables = await db.orm.public.RestaurantTable.all();
  const categories = await db.orm.public.Category.all();
  const menuItems = await db.orm.public.MenuItem.all();

  console.log("\n🏪 Restaurants:", restaurants.length);
  console.log("🪑 Tables:", tables.length);
  console.log("📂 Categories:", categories.length);
  console.log("🍽️ Menu Items:", menuItems.length);

  console.log("\n🍽️ MENU:");

  for (const item of menuItems) {
    console.log(
      `- ${item.name}: ₹${item.price ?? "TBD"} | ${
        item.isAvailable ? "Available" : "Unavailable"
      }`
    );
  }
}

verify()
  .catch((error) => {
    console.error("\n❌ Verification failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
