import { NextResponse } from "next/server";
import { Temporal } from "@js-temporal/polyfill";

import { db } from "@/lib/db";

(
  globalThis as typeof globalThis & {
    Temporal: typeof Temporal;
  }
).Temporal = Temporal;

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

const allowedTransitions: Record<string, string[]> = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { orderId } = await context.params;

    const body = await request.json();
    const newStatus = body.status;

    const validStatuses = [
      "PENDING",
      "ACCEPTED",
      "PREPARING",
      "READY",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order status.",
        },
        { status: 400 }
      );
    }

    const orders = await db.orm.public.Order.all();

    const order = orders.find(
      (item) =>
        item.id === orderId ||
        item.orderNumber === orderId
    );

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found.",
        },
        { status: 404 }
      );
    }

    const allowed = allowedTransitions[order.status] ?? [];

    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot change order from ${order.status} to ${newStatus}.`,
        },
        { status: 400 }
      );
    }

    const now = Temporal.Now.instant();

    const updatedOrder =
      await db.orm.public.Order
        .where({ id: order.id })
        .update({
          status: newStatus,
          updatedAt: now,
        });

    if (!updatedOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update order.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Order ${order.orderNumber} updated successfully.`,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
      },
    });
  } catch (error) {
    console.error("Order status update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update order status.",
      },
      { status: 500 }
    );
  }
}