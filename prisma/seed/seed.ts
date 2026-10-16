import { Temporal } from "@js-temporal/polyfill";
(globalThis as typeof globalThis & { Temporal: typeof Temporal }).Temporal = Temporal;

import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../../prisma/contract.d";
import contractJson from "../../prisma/contract.json" with { type: "json" };

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

const db = postgres<Contract>({
  contractJson,
  url: process.env.DATABASE_URL,
});

const now = Temporal.Now.instant();

const restaurantId = "restaurant-veerjis-kulcha";

const categories = [
  {
    id: "cat-kulcha",
    name: "Kulcha",
  },
  {
    id: "cat-chaat",
    name: "Chaat",
  },
  {
    id: "cat-breads",
    name: "Breads",
  },
  {
    id: "cat-chaap",
    name: "Chaap",
  },
];

const menuItems = [
  {
    id: "item-mix-kulcha",
    name: "Mix Kulcha",
    description: "Delicious mixed stuffed kulcha",
    price: "100",
    categoryId: "cat-kulcha",
    isAvailable: true,
  },
  {
    id: "item-paneer-kulcha",
    name: "Paneer Kulcha",
    description: "Soft kulcha stuffed with paneer",
    price: "140",
    categoryId: "cat-kulcha",
    isAvailable: true,
  },
  {
    id: "item-golgappa",
    name: "Golgappa",
    description: "Crispy golgappa served with flavored water",
    price: "40",
    categoryId: "cat-chaat",
    isAvailable: true,
  },
  {
    id: "item-chaat",
    name: "Chaat",
    description: "Fresh and flavorful Indian chaat",
    price: "80",
    categoryId: "cat-chaat",
    isAvailable: true,
  },
  {
    id: "item-butter-naan",
    name: "Butter Naan",
    description: "Soft naan topped with butter",
    price: null,
    categoryId: "cat-breads",
    isAvailable: false,
  },
  {
    id: "item-achari-chaap",
    name: "Achari Chaap",
    description: "Spicy achari flavored chaap",
    price: "100",
    categoryId: "cat-chaap",
    isAvailable: true,
  },
  {
    id: "item-malai-chaap",
    name: "Malai Chaap",
    description: "Creamy and delicious malai chaap",
    price: "120",
    categoryId: "cat-chaap",
    isAvailable: true,
  },
];

async function seed() {
  console.log("🌱 Starting VeerJi's Kulcha seed...\n");

  // Restaurant
  await db.orm.public.Restaurant.upsert({
    create: {
      id: restaurantId,
      name: "VeerJi's Kulcha",
      createdAt: now,
      updatedAt: now,
    },
    update: {
      name: "VeerJi's Kulcha",
      updatedAt: now,
    },
    conflictOn: {
      id: restaurantId,
    },
  });

  console.log("✅ Restaurant created");

  // Tables T01 - T10
  for (let i = 1; i <= 10; i++) {
    const tableNumber = `T${String(i).padStart(2, "0")}`;

    await db.orm.public.RestaurantTable.upsert({
      create: {
        id: `table-${tableNumber}`,
        number: tableNumber,
        qrToken: `veerjis-${tableNumber}-secure-token`,
        status: "AVAILABLE",
        restaurantId,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        number: tableNumber,
        status: "AVAILABLE",
        updatedAt: now,
      },
      conflictOn: {
        id: `table-${tableNumber}`,
      },
    });
  }

  console.log("✅ 10 restaurant tables created");

  // Categories
  for (const category of categories) {
    await db.orm.public.Category.upsert({
      create: {
        id: category.id,
        name: category.name,
        restaurantId,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        name: category.name,
        updatedAt: now,
      },
      conflictOn: {
        id: category.id,
      },
    });
  }

  console.log("✅ Menu categories created");

  // Menu items
  for (const item of menuItems) {
    await db.orm.public.MenuItem.upsert({
      create: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: null,
        isAvailable: item.isAvailable,
        categoryId: item.categoryId,
        restaurantId,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        isAvailable: item.isAvailable,
        categoryId: item.categoryId,
        updatedAt: now,
      },
      conflictOn: {
        id: item.id,
      },
    });
  }

  console.log("✅ Menu items created");

  console.log("\n🎉 VeerJi's Kulcha database seeded successfully!");
}

seed()
  .catch((error) => {
    console.error("\n❌ Seed failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });