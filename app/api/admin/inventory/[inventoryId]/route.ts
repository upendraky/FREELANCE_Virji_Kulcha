import { NextResponse } from "next/server";
import { Temporal } from "@js-temporal/polyfill";

import { db } from "@/lib/db";

(globalThis as typeof globalThis & { Temporal: typeof Temporal }).Temporal =
  Temporal;

const restaurantId = "restaurant-veerjis-kulcha";

type RouteContext = {
  params: Promise<{
    inventoryId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { inventoryId } = await context.params;
    const body = await request.json();

    const quantityChange = Number(body.quantityChange);
    const type = String(body.type ?? "").trim().toUpperCase();
    const reference = String(body.reference ?? "").trim() || null;

    if (
      !Number.isFinite(quantityChange) ||
      quantityChange === 0 ||
      !["ADD", "REMOVE", "ADJUST"].includes(type)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid stock adjustment.",
        },
        { status: 400 }
      );
    }

    const inventoryItems = await db.orm.public.InventoryItem.all();

    const item = inventoryItems.find(
      (inventoryItem) =>
        inventoryItem.id === inventoryId &&
        inventoryItem.restaurantId === restaurantId
    );

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: "Inventory item not found.",
        },
        { status: 404 }
      );
    }

    const currentQuantity = Number(item.quantity);

    let newQuantity = currentQuantity;

    if (type === "ADD") {
      newQuantity = currentQuantity + Math.abs(quantityChange);
    }

    if (type === "REMOVE") {
      newQuantity = currentQuantity - Math.abs(quantityChange);
    }

    if (type === "ADJUST") {
      newQuantity = quantityChange;
    }

    if (newQuantity < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stock quantity cannot be negative.",
        },
        { status: 400 }
      );
    }

    const now = Temporal.Now.instant();

    const updatedItem = await db.orm.public.InventoryItem
      .where({ id: inventoryId })
      .update({
        quantity: newQuantity.toFixed(2),
        updatedAt: now,
      });

    if (!updatedItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update inventory.",
        },
        { status: 500 }
      );
    }

    const transactionQuantity =
  type === "REMOVE"
    ? -Math.abs(quantityChange)
    : type === "ADD"
      ? Math.abs(quantityChange)
      : newQuantity - currentQuantity;

await db.orm.public.InventoryTransaction.create({
  id: crypto.randomUUID(),
  quantity: transactionQuantity.toFixed(2),
  type,
  reference,
  inventoryItemId: inventoryId,
  createdAt: now,
});

    let stockStatus = "IN_STOCK";

    const threshold = Number(updatedItem.threshold);

    if (newQuantity <= 0) {
      stockStatus = "OUT_OF_STOCK";
    } else if (newQuantity <= threshold) {
      stockStatus = "LOW_STOCK";
    }

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully.",
      inventory: {
        id: updatedItem.id,
        name: updatedItem.name,
        unit: updatedItem.unit,
        quantity: Number(updatedItem.quantity),
        threshold: Number(updatedItem.threshold),
        stockStatus,
      },
    });
  } catch (error) {
    console.error("Inventory adjustment failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to adjust inventory.",
      },
      { status: 500 }
    );
  }
}