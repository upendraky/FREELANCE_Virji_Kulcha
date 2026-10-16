import { NextResponse } from "next/server";
import { z } from "zod";
import { Temporal } from "@js-temporal/polyfill";

(globalThis as typeof globalThis & { Temporal: typeof Temporal }).Temporal =
  Temporal;

import { db } from "@/lib/db";

const RESTAURANT_ID = "restaurant-veerjis-kulcha";

const createMenuSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  price: z.number().nonnegative().nullable(),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
  categoryId: z.string().min(1),
});

export async function GET() {
  try {
    const [menuItems, categories] = await Promise.all([
      db.orm.public.MenuItem.all(),
      db.orm.public.Category.all(),
    ]);

    const restaurantCategories = categories
      .filter((category) => category.restaurantId === RESTAURANT_ID)
      .sort((a, b) => a.name.localeCompare(b.name));

    const items = menuItems
      .filter((item) => item.restaurantId === RESTAURANT_ID)
      .map((item) => {
        const category = restaurantCategories.find(
          (category) => category.id === item.categoryId
        );

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price === null ? null : Number(item.price),
          imageUrl: item.imageUrl,
          isAvailable: item.isAvailable,
          categoryId: item.categoryId,
          categoryName: category?.name ?? "Unknown",
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      items,
      categories: restaurantCategories.map((category) => ({
        id: category.id,
        name: category.name,
      })),
    });
  } catch (error) {
    console.error("Menu GET failed:", error);

    return NextResponse.json(
      {
        error: "Failed to load menu.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = createMenuSchema.parse(body);

    const categories = await db.orm.public.Category.all();

    const category = categories.find(
      (item) =>
        item.id === input.categoryId &&
        item.restaurantId === RESTAURANT_ID
    );

    if (!category) {
      return NextResponse.json(
        {
          error: "Invalid category.",
        },
        { status: 400 }
      );
    }

    const existingItems = await db.orm.public.MenuItem.all();

    const duplicate = existingItems.find(
      (item) =>
        item.restaurantId === RESTAURANT_ID &&
        item.name.toLowerCase() === input.name.toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json(
        {
          error: "A menu item with this name already exists.",
        },
        { status: 409 }
      );
    }

    if (input.price === null && input.isAvailable) {
      return NextResponse.json(
        {
          error: "An available menu item must have a price.",
        },
        { status: 400 }
      );
    }

    const now = Temporal.Now.instant();

    const menuItem = await db.orm.public.MenuItem.create({
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description || null,
      price: input.price === null ? null : input.price.toFixed(2),
      imageUrl: input.imageUrl || null,
      isAvailable: input.isAvailable,
      categoryId: input.categoryId,
      restaurantId: RESTAURANT_ID,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        item: {
          id: menuItem.id,
          name: menuItem.name,
          description: menuItem.description,
          price: menuItem.price === null ? null : Number(menuItem.price),
          imageUrl: menuItem.imageUrl,
          isAvailable: menuItem.isAvailable,
          categoryId: menuItem.categoryId,
          categoryName: category.name,
          createdAt: menuItem.createdAt,
          updatedAt: menuItem.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Menu POST failed:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid menu item data.",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create menu item.",
      },
      { status: 500 }
    );
  }
}