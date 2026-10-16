import { NextResponse } from "next/server";
import { Temporal } from "@js-temporal/polyfill";

import { db } from "@/lib/db";

(
  globalThis as typeof globalThis & {
    Temporal: typeof Temporal;
  }
).Temporal = Temporal;

const restaurantId = "restaurant-veerjis-kulcha";

export async function GET() {
  try {
    const inventory =
      await db.orm.public.InventoryItem.all();

    const result = inventory
      .filter(
        (item) =>
          item.restaurantId === restaurantId
      )
      .map((item) => {
        const quantity = Number(item.quantity);
        const threshold = Number(item.threshold);

        let stockStatus = "IN_STOCK";

        if (quantity <= 0) {
          stockStatus = "OUT_OF_STOCK";
        } else if (quantity <= threshold) {
          stockStatus = "LOW_STOCK";
        }

        return {
          id: item.id,
          name: item.name,
          unit: item.unit,
          quantity,
          threshold,
          stockStatus,
          updatedAt: String(item.updatedAt),
        };
      });

    return NextResponse.json({
      success: true,
      inventory: result,
    });
  } catch (error) {
    console.error(
      "Inventory fetch failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load inventory.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const unit = String(body.unit ?? "").trim();
    const quantity = Number(body.quantity);
    const threshold = Number(body.threshold);

    if (
      !name ||
      !unit ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(threshold) ||
      quantity < 0 ||
      threshold < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid inventory data.",
        },
        { status: 400 }
      );
    }

    const now = Temporal.Now.instant();

    const item =
      await db.orm.public.InventoryItem.create({
        id: crypto.randomUUID(),
        name,
        unit,
        quantity: quantity.toFixed(2),
        threshold: threshold.toFixed(2),
        restaurantId,
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json(
      {
        success: true,
        inventory: {
          id: item.id,
          name: item.name,
          unit: item.unit,
          quantity: Number(item.quantity),
          threshold: Number(item.threshold),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Inventory creation failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create inventory item.",
      },
      { status: 500 }
    );
  }
}