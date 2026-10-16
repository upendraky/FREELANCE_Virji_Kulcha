import { NextResponse } from "next/server";
import { Temporal } from "@js-temporal/polyfill";

(globalThis as typeof globalThis & { Temporal: typeof Temporal }).Temporal =
  Temporal;

import { db } from "@/lib/db";

type Params = {
  params: Promise<{ orderId: string }>;
};

/**
 * GET /api/counter/orders/[orderId]/bill
 *
 * Returns the generated bill together with
 * complete order, customer, table, item and payment details.
 */
export async function GET(
  _request: Request,
  { params }: Params
) {
  try {
    const { orderId } = await params;
    const restaurantId = "restaurant-veerjis-kulcha";

    const orders = await db.orm.public.Order.all();
    const order = orders.find(
      (item) =>
        item.id === orderId &&
        item.restaurantId === restaurantId
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

    const bills = await db.orm.public.Bill.all();
    const bill = bills.find(
      (item) => item.orderId === order.id
    );

    if (!bill) {
      return NextResponse.json(
        {
          success: false,
          error: "Bill has not been generated for this order.",
        },
        { status: 404 }
      );
    }

    const orderItems = await db.orm.public.OrderItem.all();
    const menuItems = await db.orm.public.MenuItem.all();
    const payments = await db.orm.public.Payment.all();
    const tables = await db.orm.public.RestaurantTable.all();

    const payment = payments.find(
      (item) => item.orderId === order.id
    );

    const table = tables.find(
      (item) => item.id === order.tableId
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
          name: menuItem?.name ?? "Unknown Item",
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          total: String(item.total),
        };
      });

    return NextResponse.json({
      success: true,

      bill: {
        id: bill.id,
        billNumber: bill.billNumber,
        status: bill.status,
        amount: String(bill.amount),
        generatedAt: bill.generatedAt
          ? String(bill.generatedAt)
          : null,
        printedAt: bill.printedAt
          ? String(bill.printedAt)
          : null,
      },

      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        type: order.type,
        status: order.status,
        tableNumber: table?.number ?? null,
        total: String(order.total),
        createdAt: String(order.createdAt),
      },

      items,

      payment: payment
        ? {
            method: payment.method,
            status: payment.status,
            amount: String(payment.amount),
            transactionId: payment.transactionId,
            paidAt: payment.paidAt
              ? String(payment.paidAt)
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error("Bill fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load bill.",
      },
      { status: 500 }
    );
  }
}


/**
 * POST /api/counter/orders/[orderId]/bill
 *
 * Generates a bill for a paid order.
 */
export async function POST(
  _request: Request,
  { params }: Params
) {
  try {
    const { orderId } = await params;
    const restaurantId = "restaurant-veerjis-kulcha";

    const orders = await db.orm.public.Order.all();

    const order = orders.find(
      (item) =>
        item.id === orderId &&
        item.restaurantId === restaurantId
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

    const payments = await db.orm.public.Payment.all();

    const payment = payments.find(
      (item) => item.orderId === order.id
    );

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment record not found.",
        },
        { status: 400 }
      );
    }

    if (payment.status !== "PAID") {
      return NextResponse.json(
        {
          success: false,
          error: "Bill can only be generated after payment is received.",
        },
        { status: 400 }
      );
    }

    const bills = await db.orm.public.Bill.all();

    const existingBill = bills.find(
      (item) => item.orderId === order.id
    );

    if (existingBill) {
      return NextResponse.json({
        success: true,
        message: "Bill already exists.",
        bill: {
          id: existingBill.id,
          billNumber: existingBill.billNumber,
          status: existingBill.status,
          amount: String(existingBill.amount),
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          type: order.type,
          paymentMethod: payment.method,
          paymentStatus: payment.status,
          generatedAt: existingBill.generatedAt
            ? String(existingBill.generatedAt)
            : null,
        },
      });
    }

    const users = await db.orm.public.User.all();

    const operator =
      users.find((user) => user.role === "COUNTER_OPERATOR") ??
      users.find((user) => user.role === "OWNER");

    if (!operator) {
      return NextResponse.json(
        {
          success: false,
          error: "No authorized counter operator found.",
        },
        { status: 500 }
      );
    }

    const now = Temporal.Now.instant();

    const billId = crypto.randomUUID();

    const billNumber =
      `VK-B${Date.now().toString().slice(-8)}`;

    const bill = await db.orm.public.Bill.create({
      id: billId,
      billNumber,
      status: "GENERATED",
      amount: String(order.total),
      orderId: order.id,
      generatedById: operator.id,
      generatedAt: now,
      printedAt: null,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "Bill generated successfully.",

      bill: {
        id: bill.id,
        billNumber: bill.billNumber,
        status: bill.status,
        amount: String(bill.amount),
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        type: order.type,
        paymentMethod: payment.method,
        paymentStatus: payment.status,
        generatedAt: bill.generatedAt
          ? String(bill.generatedAt)
          : null,
      },
    });
  } catch (error) {
    console.error("Bill generation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate bill.",
      },
      { status: 500 }
    );
  }
}
