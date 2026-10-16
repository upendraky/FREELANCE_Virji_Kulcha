import { NextResponse } from "next/server";
import { z } from "zod";
import { Temporal } from "@js-temporal/polyfill";

(globalThis as typeof globalThis & { Temporal: typeof Temporal }).Temporal =
  Temporal;

import { db } from "@/lib/db";

const RESTAURANT_ID = "restaurant-veerjis-kulcha";

const updateMenuSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  imageUrl: z.string().trim().url().nullable().optional(),
  isAvailable: z.boolean().optional(),
  categoryId: z.string().min(1).optional(),
});

type RouteContext = {
  params: Promise<{
    menuItemId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { menuItemId } = await context.params;
    const body = await request.json();
    const input = updateMenuSchema.parse(body);

    const menuItems = await db.orm.public.MenuItem.all();

    const existingItem = menuItems.find(
      (item) =>
        item.id === menuItemId &&
        item.restaurantId === RESTAURANT_ID
    );

    if (!existingItem) {
      return NextResponse.json(
        {
          error: "Menu item not found.",
        },
        { status: 404 }
      );
    }

    if (
      input.name &&
      input.name.toLowerCase() !== existingItem.name.toLowerCase()
    ) {
      const duplicate = menuItems.find(
        (item) =>
          item.restaurantId === RESTAURANT_ID &&
          item.id !== menuItemId &&
          item.name.toLowerCase() === input.name!.toLowerCase()
      );

      if (duplicate) {
        return NextResponse.json(
          {
            error: "A menu item with this name already exists.",
          },
          { status: 409 }
        );
      }
    }

    if (input.categoryId) {
      const categories = await db.orm.public.Category.all();

      const categoryExists = categories.some(
        (category) =>
          category.id === input.categoryId &&
          category.restaurantId === RESTAURANT_ID
      );

      if (!categoryExists) {
        return NextResponse.json(
          {
            error: "Invalid category.",
          },
          { status: 400 }
        );
      }
    }

    const finalPrice =
      input.price !== undefined
        ? input.price
        : existingItem.price === null
          ? null
          : Number(existingItem.price);

    const finalAvailability =
      input.isAvailable !== undefined
        ? input.isAvailable
        : existingItem.isAvailable;

    if (finalAvailability && finalPrice === null) {
      return NextResponse.json(
        {
          error: "An available menu item must have a price.",
        },
        { status: 400 }
      );
    }

    const now = Temporal.Now.instant();

    const updatedItem = await db.orm.public.MenuItem
      .where({ id: menuItemId })
      .update({
        name: input.name ?? existingItem.name,
        description:
          input.description !== undefined
            ? input.description
            : existingItem.description,
        price:
          finalPrice === null
            ? null
            : finalPrice.toFixed(2),
        imageUrl:
          input.imageUrl !== undefined
            ? input.imageUrl
            : existingItem.imageUrl,
        isAvailable: finalAvailability,
        categoryId: input.categoryId ?? existingItem.categoryId,
        updatedAt: now,
      });

    if (!updatedItem) {
      return NextResponse.json(
        {
          error: "Failed to update menu item.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item: {
        id: updatedItem.id,
        name: updatedItem.name,
        description: updatedItem.description,
        price:
          updatedItem.price === null
            ? null
            : Number(updatedItem.price),
        imageUrl: updatedItem.imageUrl,
        isAvailable: updatedItem.isAvailable,
        categoryId: updatedItem.categoryId,
        updatedAt: updatedItem.updatedAt,
      },
    });
  } catch (error) {
    console.error("Menu PATCH failed:", error);

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
            : "Failed to update menu item.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { menuItemId } = await context.params;

    const menuItems = await db.orm.public.MenuItem.all();

    const existingItem = menuItems.find(
      (item) =>
        item.id === menuItemId &&
        item.restaurantId === RESTAURANT_ID
    );

    if (!existingItem) {
      return NextResponse.json(
        {
          error: "Menu item not found.",
        },
        { status: 404 }
      );
    }

    const orderItems = await db.orm.public.OrderItem.all();

    const hasOrders = orderItems.some(
      (item) => item.menuItemId === menuItemId
    );

    if (hasOrders) {
      return NextResponse.json(
        {
          error:
            "This menu item is already used in orders. Mark it unavailable instead of deleting it.",
        },
        { status: 409 }
      );
    }

    const deletedItem = await db.orm.public.MenuItem
      .where({ id: menuItemId })
      .delete();

    if (!deletedItem) {
      return NextResponse.json(
        {
          error: "Failed to delete menu item.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Menu item deleted successfully.",
      itemId: menuItemId,
    });
  } catch (error) {
    console.error("Menu DELETE failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete menu item.",
      },
      { status: 500 }
    );
  }
}