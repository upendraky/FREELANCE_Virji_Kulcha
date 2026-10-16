import { NextResponse } from "next/server";
import { z } from "zod";

import { cashfree } from "@/lib/cashfree";
import { db } from "@/lib/db";

const paymentSchema = z.object({
  orderId: z.string().min(1),
});

const RESTAURANT_ID = "restaurant-veerjis-kulcha";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = paymentSchema.parse(body);

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

    if (order.type === "TAKEAWAY") {
      // Takeaway is UPI-only in our system.
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

    if (payment.method !== "UPI") {
      return NextResponse.json(
        { error: "Cash payments cannot use online checkout." },
        { status: 400 }
      );
    }

    if (payment.status === "PAID") {
      return NextResponse.json(
        { error: "This order has already been paid." },
        { status: 400 }
      );
    }

    const customerPhone = order.customerPhone;

    const cashfreeOrderId = `VK_${order.orderNumber}`;

    const response = await cashfree.PGCreateOrder(
      {
        order_amount: Number(order.total),
        order_currency: "INR",
        order_id: cashfreeOrderId,
        customer_details: {
          customer_id: order.id,
          customer_name: order.customerName,
          customer_phone: customerPhone,
        },
        order_meta: {
          return_url:
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}` +
            `/order-confirmation?orderId=${order.id}&orderNumber=${order.orderNumber}`,
        },
        order_note: `VeerJi's Kulcha Order ${order.orderNumber}`,
      }
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      cashfreeOrderId,
      paymentSessionId:
        response.data?.payment_session_id ?? null,
    });
  } catch (error) {
    console.error("Cashfree order creation failed:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid payment request.",
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
            : "Failed to create payment.",
      },
      { status: 500 }
    );
  }
}
