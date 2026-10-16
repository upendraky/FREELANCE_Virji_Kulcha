import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const restaurantId = "restaurant-veerjis-kulcha";

export async function GET() {
  try {
    const inventoryItems =
      await db.orm.public.InventoryItem.all();

    const transactions =
      await db.orm.public.InventoryTransaction.all();

    const restaurantItems = inventoryItems.filter(
      (item) => item.restaurantId === restaurantId
    );

    const restaurantItemIds = new Set(
      restaurantItems.map((item) => item.id)
    );

    const history = transactions
      .filter((transaction) =>
        restaurantItemIds.has(transaction.inventoryItemId)
      )
      .map((transaction) => {
        const item = restaurantItems.find(
          (inventoryItem) =>
            inventoryItem.id === transaction.inventoryItemId
        );

        return {
          id: transaction.id,
          inventoryItemId: transaction.inventoryItemId,
          itemName: item?.name ?? "Unknown Item",
          unit: item?.unit ?? "",
          quantity: Number(transaction.quantity),
          type: transaction.type,
          reference: transaction.reference,
          createdAt: String(transaction.createdAt),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Inventory history fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load inventory history.",
      },
      { status: 500 }
    );
  }
}