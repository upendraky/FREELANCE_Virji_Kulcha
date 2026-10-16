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

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const [
      orders,
      payments,
      tables,
      orderItems,
      menuItems,
    ] = await Promise.all([
      db.orm.public.Order.all(),
      db.orm.public.Payment.all(),
      db.orm.public.RestaurantTable.all(),
      db.orm.public.OrderItem.all(),
      db.orm.public.MenuItem.all(),
    ]);

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

    const payment =
      payments.find(
        (item) => item.orderId === order.id
      ) ?? null;

    const table = order.tableId
      ? tables.find(
          (item) => item.id === order.tableId
        )
      : null;

    const items = orderItems
      .filter(
        (item) => item.orderId === order.id
      )
      .map((item) => {
        const menuItem = menuItems.find(
          (menu) => menu.id === item.menuItemId
        );

        return {
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
          menuItem: {
            name:
              menuItem?.name ?? "Unknown Item",
          },
        };
      });

    return NextResponse.json({
      success: true,

      order: {
        id: order.id,

        orderNumber: order.orderNumber,

        customerName: order.customerName,

        customerPhone: order.customerPhone,

        type: order.type,

        tableNumber:
          table?.number ?? null,

        total: Number(order.total),

        status: order.status,

        payment: payment
          ? {
              method: payment.method,
              status: payment.status,
            }
          : null,

        items,
      },
    });
  } catch (error) {
    console.error(
      "Order tracking failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load order.",
      },
      { status: 500 }
    );
  }
}