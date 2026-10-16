import { NextResponse } from "next/server";
import { Temporal } from "@js-temporal/polyfill";

(globalThis as typeof globalThis & {
  Temporal: typeof Temporal;
}).Temporal = Temporal;

import { db } from "@/lib/db";

const RESTAURANT_ID = "restaurant-veerjis-kulcha";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ orderId: string }>;
  }
) {
  try {
    const { orderId } = await context.params;

    // -----------------------------------------
    // 1. Find the order
    // -----------------------------------------

    const orders = await db.orm.public.Order.all();

    const order = orders.find(
      (item) =>
        item.id === orderId &&
        item.restaurantId === RESTAURANT_ID
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

    // -----------------------------------------
    // 2. Find payment
    // -----------------------------------------

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
        { status: 404 }
      );
    }

    // -----------------------------------------
    // 3. Verify payment method
    // -----------------------------------------

    if (payment.method !== "CASH") {
      return NextResponse.json(
        {
          success: false,
          error: "This order is not a cash payment.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 4. Idempotency
    // -----------------------------------------

    if (payment.status === "PAID") {
      return NextResponse.json({
        success: true,
        message: "Payment was already confirmed.",
        paymentStatus: "PAID",
        orderStatus: order.status,
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    }

    // -----------------------------------------
    // 5. Invalid payment states
    // -----------------------------------------

    if (
      payment.status === "FAILED" ||
      payment.status === "REFUNDED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment cannot be confirmed because it is ${payment.status}.`,
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 6. Find authorized operator
    // -----------------------------------------

    const users = await db.orm.public.User.all();

    let operator = users.find(
      (user) => user.role === "COUNTER_OPERATOR"
    );

    if (!operator) {
      operator = users.find(
        (user) => user.role === "OWNER"
      );
    }

    if (!operator) {
      return NextResponse.json(
        {
          success: false,
          error: "No authorized counter operator found.",
        },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 7. Timestamp
    // -----------------------------------------

    const now = Temporal.Now.instant();

    // -----------------------------------------
    // 8. Atomic payment + order update
    // -----------------------------------------

    await db.transaction(async (tx) => {
      /*
       * Mark cash payment as PAID.
       *
       * The status condition protects against
       * two counter operators confirming the
       * same payment simultaneously.
       */
      const updatedPayment =
        await tx.orm.public.Payment
          .where({
            id: payment.id,
            status: "PENDING",
          })
          .update({
            status: "PAID",
            confirmedById: operator.id,
            paidAt: now,
            updatedAt: now,
          });

      if (!updatedPayment) {
        throw new Error(
          "Payment was already processed or is no longer pending."
        );
      }

      /*
       * Accept the order only after the cash payment
       * has successfully been marked as paid.
       */
      const updatedOrder =
        await tx.orm.public.Order
          .where({
            id: order.id,
            status: "PENDING",
          })
          .update({
            status: "ACCEPTED",
            acceptedById: operator.id,
            updatedAt: now,
          });

      if (!updatedOrder) {
        throw new Error(
          "Order was already processed or is no longer pending."
        );
      }
    });

    // -----------------------------------------
    // 9. Success response
    // -----------------------------------------

    return NextResponse.json({
      success: true,
      message:
        "Cash payment received and order accepted.",
      paymentStatus: "PAID",
      orderStatus: "ACCEPTED",
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error(
      "Cash payment confirmation failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to confirm cash payment.",
      },
      { status: 500 }
    );
  }
}