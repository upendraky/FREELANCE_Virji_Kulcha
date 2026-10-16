import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const restaurantId = "restaurant-veerjis-kulcha";

    const orders = await db.orm.public.Order.all();
    const orderItems = await db.orm.public.OrderItem.all();
    const payments = await db.orm.public.Payment.all();
    const tables = await db.orm.public.RestaurantTable.all();
    const menuItems = await db.orm.public.MenuItem.all();

    const restaurantOrders = orders
      .filter((order) => order.restaurantId === restaurantId)
      .sort(
        (a, b) =>
          new Date(String(b.createdAt)).getTime() -
          new Date(String(a.createdAt)).getTime()
      );

    const result = restaurantOrders.map((order) => {
      const table = tables.find(
        (table) => table.id === order.tableId
      );

      const payment = payments.find(
        (payment) => payment.orderId === order.id
      );

      const items = orderItems
        .filter((item) => item.orderId === order.id)
        .map((item) => {
          const menuItem = menuItems.find(
            (menu) => menu.id === item.menuItemId
          );

          return {
            id: item.id,
            menuItemId: item.menuItemId,
            menuItemName: menuItem?.name ?? "Unknown Item",
            quantity: item.quantity,
            unitPrice: String(item.unitPrice),
            total: String(item.total),
          };
        });

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        type: order.type,
        status: order.status,
        tableId: order.tableId,
        tableNumber: table?.number ?? null,
        total: String(order.total),
        createdAt: String(order.createdAt),

        payment: payment
          ? {
              id: payment.id,
              method: payment.method,
              status: payment.status,
              amount: String(payment.amount),
              transactionId: payment.transactionId,
              paidAt: payment.paidAt
                ? String(payment.paidAt)
                : null,
            }
          : null,

        items,
      };
    });

    return NextResponse.json({
      success: true,
      orders: result,
    });
  } catch (error) {
    console.error("Counter orders fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load counter orders.",
      },
      { status: 500 }
    );
  }
}
