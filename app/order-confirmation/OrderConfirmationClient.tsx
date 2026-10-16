"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type OrderData = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  type: "DINE_IN" | "TAKEAWAY";
  table?: {
    number: string;
  } | null;
  total: number;
  status: string;
  payment?: {
    method: "UPI" | "CASH";
    status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  } | null;
  items?: Array<{
    quantity: number;
    unitPrice: number;
    total: number;
    menuItem: {
      name: string;
    };
  }>;
};

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId") || "";

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    async function verifyAndLoadOrder() {
      try {
        setVerifying(true);

        /*
         * UPI:
         * Ask our server to verify the payment directly
         * with Cashfree.
         *
         * Cash orders are already Payment Pending and
         * are handled by the Counter Operator.
         */
        const paymentResponse = await fetch(
          "/api/payments/cashfree/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId,
            }),
          }
        );

        const verificationData =
          await paymentResponse.json();

        /*
         * If this is a cash order, Cashfree verification
         * is not applicable. We still continue to load
         * the restaurant order below.
         */
        if (
          !paymentResponse.ok &&
          verificationData?.error &&
          !verificationData.error
            .toLowerCase()
            .includes("cash")
        ) {
          console.warn(
            "Payment verification response:",
            verificationData
          );
        }

        /*
         * Load the latest order state from our database.
         */
        const orderResponse = await fetch(
          `/api/orders/${encodeURIComponent(orderId)}`,
          {
            cache: "no-store",
          }
        );

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
          throw new Error(
            orderData.error || "Failed to load order."
          );
        }

        setOrder(orderData.order || orderData);
      } catch (error) {
        console.error(
          "Order confirmation failed:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load your order."
        );
      } finally {
        setVerifying(false);
        setLoading(false);
      }
    }

    verifyAndLoadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50 px-5">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-2xl">
            ⏳
          </div>

          <h1 className="mt-5 text-xl font-bold text-gray-900">
            Confirming Your Order
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {verifying
              ? "Verifying your payment securely..."
              : "Loading your order..."}
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50 px-5">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">
            !
          </div>

          <h1 className="mt-5 text-xl font-bold text-gray-900">
            Unable to Load Order
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error || "Order information could not be found."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 w-full rounded-xl bg-orange-500 py-3 font-bold text-white"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const isDineIn = order.type === "DINE_IN";
  const isCash = order.payment?.method === "CASH";
  const isPaid = order.payment?.status === "PAID";

  const paymentLabel = isPaid
    ? "Payment Successful"
    : order.payment?.status === "FAILED"
      ? "Payment Failed"
      : order.payment?.status === "REFUNDED"
        ? "Payment Refunded"
        : "Payment Pending";

  const statusLabel =
    order.status === "PENDING"
      ? "Order Received"
      : order.status === "ACCEPTED"
        ? "Confirmed"
        : order.status === "PREPARING"
          ? "Preparing"
          : order.status === "READY"
            ? "Ready"
            : order.status === "COMPLETED"
              ? "Completed"
              : order.status === "CANCELLED"
                ? "Cancelled"
                : order.status;

  return (
    <main className="min-h-screen bg-orange-50">
      <header className="border-b border-orange-100 bg-white print:hidden">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm font-medium text-orange-600"
          >
            ← Back to Home
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-5 py-10">
        {/* Confirmation */}
        <div className="text-center">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
              isPaid || isCash
                ? "bg-green-100"
                : "bg-yellow-100"
            }`}
          >
            {isPaid || isCash ? "✓" : "⏳"}
          </div>

          <h1 className="mt-5 text-3xl font-bold text-gray-900">
            {isPaid
              ? "Order Confirmed! 🎉"
              : isCash
                ? "Order Placed! 🎉"
                : "Payment Pending"}
          </h1>

          <p className="mt-2 text-gray-600">
            Thank you for ordering from
            VeerJi&apos;s Kulcha.
          </p>
        </div>

        {/* Order ID */}
        <div className="mt-8 rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Your Order ID
          </p>

          <p className="mt-2 text-3xl font-black tracking-wide text-orange-600">
            {order.orderNumber}
          </p>

          <p className="mt-2 break-all text-xs text-gray-400">
            Reference: {order.id}
          </p>
        </div>

        {/* Payment Status */}
        <div
          className={`mt-5 rounded-2xl border p-5 ${
            isPaid
              ? "border-green-200 bg-green-50"
              : order.payment?.status === "FAILED"
                ? "border-red-200 bg-red-50"
                : "border-yellow-200 bg-yellow-50"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900">
                {paymentLabel}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {isCash
                  ? "Cash payment at restaurant counter"
                  : "UPI payment verified by server"}
              </p>
            </div>

            <span className="text-2xl">
              {isPaid ? "✅" : "⏳"}
            </span>
          </div>
        </div>

        {/* Cash Instructions */}
        {isCash &&
          order.payment?.status === "PENDING" && (
            <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <h2 className="font-bold text-orange-800">
                💵 Pay at Counter
              </h2>

              <div className="mt-3 space-y-2 text-sm leading-6 text-orange-700">
                <p>
                  1. Note your Order ID:
                  <strong className="ml-1">
                    {order.orderNumber}
                  </strong>
                </p>

                <p>
                  2. Go to the restaurant counter.
                </p>

                <p>
                  3. Show your Order ID to the
                  Counter Operator.
                </p>

                <p>
                  4. Pay ₹{order.total} in cash.
                </p>

                <p>
                  5. The Counter Operator will
                  confirm your payment and accept
                  the order.
                </p>
              </div>
            </div>
          )}

        {/* Customer Receipt */}
        <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Customer Receipt
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Customer
              </span>

              <span className="font-semibold text-gray-900">
                {order.customerName}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Mobile
              </span>

              <span className="font-semibold text-gray-900">
                +91 {order.customerPhone}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Order Type
              </span>

              <span className="font-semibold text-gray-900">
                {isDineIn ? "Dine-In" : "Takeaway"}
              </span>
            </div>

            {isDineIn && order.table && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  Table
                </span>

                <span className="font-semibold text-gray-900">
                  {order.table.number}
                </span>
              </div>
            )}

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Payment
              </span>

              <span className="font-semibold uppercase text-gray-900">
                {order.payment?.method || "UPI"}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              Items
            </h2>

            <div className="mt-4 divide-y divide-gray-100">
              {order.items.map((item, index) => (
                <div
                  key={`${item.menuItem.name}-${index}`}
                  className="flex justify-between gap-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.menuItem.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      × {item.quantity}
                    </p>
                  </div>

                  <p className="font-semibold text-gray-900">
                    ₹{item.total}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">
                  Total
                </span>

                <span className="text-2xl font-black text-orange-600">
                  ₹{order.total}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Order Status */}
        <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Order Status
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white">
                ✓
              </div>

              <div>
                <p className="font-bold text-gray-900">
                  Order Received
                </p>

                <p className="text-sm text-gray-500">
                  Your order has been received.
                </p>
              </div>
            </div>

            <div className="ml-5 h-6 border-l-2 border-dashed border-gray-200" />

            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  order.status !== "PENDING"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {order.status !== "PENDING" ? "✓" : "2"}
              </div>

              <div>
                <p
                  className={`font-semibold ${
                    order.status !== "PENDING"
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {order.status !== "PENDING"
                    ? "Confirmed"
                    : "Waiting for Confirmation"}
                </p>

                <p className="text-sm text-gray-500">
                  {statusLabel}
                </p>
              </div>
            </div>

            <div className="ml-5 h-6 border-l-2 border-dashed border-gray-200" />

            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  order.status === "PREPARING" ||
                  order.status === "READY" ||
                  order.status === "COMPLETED"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {order.status === "PREPARING" ||
                order.status === "READY" ||
                order.status === "COMPLETED"
                  ? "✓"
                  : "3"}
              </div>

              <div>
                <p
                  className={`font-semibold ${
                    order.status === "PREPARING" ||
                    order.status === "READY" ||
                    order.status === "COMPLETED"
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  Preparing
                </p>

                <p className="text-sm text-gray-500">
                  Kitchen preparation will begin.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/tracking?orderId=${encodeURIComponent(
                  order.id
                )}&orderNumber=${encodeURIComponent(
                  order.orderNumber
                )}`
              )
            }
            className="w-full rounded-xl bg-orange-500 py-4 font-bold text-white transition hover:bg-orange-600 print:hidden"
          >
            Track My Order →
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full rounded-xl border-2 border-orange-500 bg-white py-4 font-bold text-orange-600 transition hover:bg-orange-50 print:hidden"
          >
            🖨️ Print Receipt
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full rounded-xl border border-gray-200 bg-white py-4 font-semibold text-gray-700 hover:bg-gray-50 print:hidden"
          >
            Place Another Order
          </button>
        </div>
      </section>
    </main>
  );
}