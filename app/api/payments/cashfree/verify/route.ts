import { NextResponse } from "next/server";
import { z } from "zod";
import { Temporal } from "@js-temporal/polyfill";

import { cashfree } from "@/lib/cashfree";
import { db } from "@/lib/db";

const verifySchema = z.object({
  orderId: z.string().min(1),
});

const RESTAURANT_ID = "restaurant-veerjis-kulcha";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = verifySchema.parse(body);

    const orders = await db.orm.public.Order.all();

    const order = orders.find(
      (item) =>
        item.id === input.orderId &&
        item.restaurantId === RESTAURANT_ID
    );

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const payments = await db.orm.public.Payment.all();

    const payment = payments.find(
      (item) => item.orderId === order.id
    );

    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found." },
        { status: 404 }
      );
    }

    const cashfreeOrderId = `VK_${order.orderNumber}`;

    const response = await cashfree.PGFetchOrder(
      cashfreeOrderId
    );

    const cashfreeOrder = response.data;

    if (!cashfreeOrder) {
      return NextResponse.json(
        { error: "Cashfree order not found." },
        { status: 404 }
      );
    }

    const cashfreeStatus = cashfreeOrder.order_status;

    let paymentStatus:
      | "PENDING"
      | "PAID"
      | "FAILED"
      | "REFUNDED";

    let orderStatus:
      | "PENDING"
      | "ACCEPTED"
      | "PREPARING"
      | "READY"
      | "COMPLETED"
      | "CANCELLED";

    switch (cashfreeStatus) {
      case "PAID":
        paymentStatus = "PAID";
        orderStatus = "ACCEPTED";
        break;

      case "ACTIVE":
        paymentStatus = "PENDING";
        orderStatus = "PENDING";
        break;

      case "EXPIRED":
      case "TERMINATED":
        paymentStatus = "FAILED";
        orderStatus = "CANCELLED";
        break;

      default:
        paymentStatus = "PENDING";
        orderStatus = "PENDING";
    }


    const now = Temporal.Now.instant();

    await db.orm.public.Payment
      .where({ id: payment.id })
      .update({
        status: paymentStatus,
        transactionId:
          cashfreeOrder.cf_order_id ?? payment.transactionId ?? null,
        paidAt:
          paymentStatus === "PAID"
            ? payment.paidAt ?? now
            : payment.paidAt,
        updatedAt: now,
      });

    await db.orm.public.Order
      .where({ id: order.id })
      .update({
        status: orderStatus,
        updatedAt: now,
      });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus,
      orderStatus,
      cashfreeOrderStatus: cashfreeStatus,
      amount: Number(order.total),
    });
  } catch (error) {
    console.error(
      "Cashfree payment verification failed:",
      error
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid verification request.",
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
            : "Failed to verify payment.",
      },
      { status: 500 }
    );
  }
}