import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { Temporal } from "@js-temporal/polyfill";

function verifySignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  secretKey: string
) {
  const signedPayload = timestamp + rawBody;

  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(signedPayload)
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Cashfree webhook signature",
        },
        { status: 401 }
      );
    }

    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Cashfree secret key is not configured",
        },
        { status: 500 }
      );
    }

    const valid = verifySignature(
      rawBody,
      signature,
      timestamp,
      secretKey
    );

    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook signature",
        },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);

    const orderId =
      payload?.data?.order?.order_id ??
      payload?.data?.order?.orderId;

    const paymentStatus =
      payload?.data?.payment?.payment_status ??
      payload?.data?.payment?.paymentStatus;

    const cfPaymentId =
      payload?.data?.payment?.cf_payment_id ??
      payload?.data?.payment?.cfPaymentId;

    if (!orderId) {
      return NextResponse.json({
        success: true,
        message: "Webhook received without order ID",
      });
    }

    console.log("Cashfree webhook:", {
      orderId,
      paymentStatus,
      cfPaymentId,
    });

    /*
     * Our Cashfree order ID format:
     * VK_<our order number>
     *
     * Example:
     * VK_VK02414735
     */
    if (!orderId.startsWith("VK_")) {
      return NextResponse.json({
        success: true,
        message: "Webhook ignored",
      });
    }

    const orderNumber = orderId.replace("VK_", "");
const orderResult = await db.orm.public.Order.first({
  orderNumber,
});
   

    if (!orderResult) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    const order = orderResult;

    /*
     * IMPORTANT:
     * Ignore duplicate webhook events once payment
     * has already reached a terminal state.
     */
    if (
      paymentStatus === "SUCCESS" &&
      order.status === "ACCEPTED"
    ) {
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
      });
    }

    if (
      paymentStatus === "SUCCESS" ||
      paymentStatus === "PAID"
    ) {
     await db.orm.public.Payment
  .where({
    orderId: order.id,
  })
  .update({

          status: "PAID",
          transactionId: cfPaymentId
            ? String(cfPaymentId)
            : undefined,
          paidAt: Temporal.Now.instant(),
        });
await db.orm.public.Order
  .where({
    id: order.id,
  })
  .update({
     

          status: "ACCEPTED",
        });

      return NextResponse.json({
        success: true,
        message: "Payment marked as paid",
        orderNumber: order.orderNumber,
      });
    }

    if (
      paymentStatus === "FAILED" ||
      paymentStatus === "USER_DROPPED"
    ) {
     await db.orm.public.Payment
        .where({
          orderId: order.id,
        })
        .update({
          status: "FAILED",
        });

     await db.orm.public.Order
  .where({
    id: order.id,
  })
  .update({
          status: "CANCELLED",
        });

      return NextResponse.json({
        success: true,
        message: "Payment marked as failed",
        orderNumber: order.orderNumber,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Webhook received",
      orderNumber: order.orderNumber,
      paymentStatus,
    });
  } catch (error) {
    console.error("Cashfree webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}