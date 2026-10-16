"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

type OrderData = {
  id: string;
  orderNumber: string;
  customerName: string;
  type: "DINE_IN" | "TAKEAWAY";
  tableNumber: string | null;
  total: string;
  status: OrderStatus;
  payment: {
    method: "UPI" | "CASH";
    status:
      | "PENDING"
      | "PAID"
      | "FAILED"
      | "REFUNDED";
  } | null;
};

function TrackingContent() {
  const searchParams = useSearchParams();

  const orderId =
    searchParams.get("orderId") || "";

  const [order, setOrder] =
    useState<OrderData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadOrder() {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/orders/${orderId}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to load order."
        );
      }

      setOrder(data.order);
      setError("");
    } catch (error) {
      console.error(
        "Tracking load failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load order."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();

    const interval = setInterval(
      loadOrder,
      5000
    );

    return () =>
      clearInterval(interval);
  }, [orderId]);

  function getStepStatus(
    step: OrderStatus
  ) {
    if (!order) {
      return "upcoming";
    }

    const steps: OrderStatus[] = [
      "PENDING",
      "ACCEPTED",
      "PREPARING",
      "READY",
      "COMPLETED",
    ];

    if (
      order.status === "CANCELLED"
    ) {
      return "cancelled";
    }

    const currentIndex =
      steps.indexOf(order.status);

    const stepIndex =
      steps.indexOf(step);

    if (
      stepIndex < currentIndex
    ) {
      return "completed";
    }

    if (
      stepIndex === currentIndex
    ) {
      return "current";
    }

    return "upcoming";
  }

  function statusText() {
    if (!order) {
      return "";
    }

    switch (order.status) {
      case "PENDING":
        return "Order Received";

      case "ACCEPTED":
        return "Order Confirmed";

      case "PREPARING":
        return "Your Order is Being Prepared";

      case "READY":
        return "Your Order is Ready 🎉";

      case "COMPLETED":
        return "Order Completed ✓";

      case "CANCELLED":
        return "Order Cancelled";

      default:
        return order.status;
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">
            Loading your order...
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm">

          <div className="text-5xl">
            ⚠️
          </div>

          <h1 className="mt-4 text-2xl font-black text-slate-900">
            Unable to Track Order
          </h1>

          <p className="mt-2 text-slate-500">
            {error ||
              "Order information was not found."}
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-orange-600 px-6 py-3 font-bold text-white"
          >
            Back to Home
          </Link>

        </div>
      </main>
    );
  }

  const steps = [
    {
      status: "PENDING" as OrderStatus,
      title: "Order Received",
      description:
        "We received your order.",
      icon: "📝",
    },
    {
      status: "ACCEPTED" as OrderStatus,
      title: "Confirmed",
      description:
        "Restaurant accepted your order.",
      icon: "✓",
    },
    {
      status: "PREPARING" as OrderStatus,
      title: "Preparing",
      description:
        "Our kitchen is preparing your food.",
      icon: "👨‍🍳",
    },
    {
      status: "READY" as OrderStatus,
      title: "Ready",
      description:
        "Your order is ready.",
      icon: "🎉",
    },
    {
      status: "COMPLETED" as OrderStatus,
      title: "Completed",
      description:
        "Thank you for ordering!",
      icon: "✓",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">

      <div className="mx-auto max-w-2xl space-y-5">

        {/* Header */}
        <div className="text-center">

          <p className="text-sm font-bold tracking-widest text-orange-600">
            VEERJI&apos;S KULCHA
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Track Your Order
          </h1>

          <p className="mt-2 text-slate-500">
            Order #{order.orderNumber}
          </p>

        </div>

        {/* Current Status */}
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm md:p-8">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-4xl">
            {order.status ===
            "COMPLETED"
              ? "✓"
              : order.status ===
                "READY"
              ? "🎉"
              : order.status ===
                "PREPARING"
              ? "👨‍🍳"
              : "🍽️"}
          </div>

          <h2 className="mt-5 text-2xl font-black text-slate-900">
            {statusText()}
          </h2>

          <p className="mt-2 text-slate-500">
            We&apos;ll keep your order status
            updated automatically.
          </p>

        </div>

        {/* Order Information */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-slate-900">
            Order Information
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-5">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Order ID
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {order.orderNumber}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Customer
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {order.customerName}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Order Type
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {order.type ===
                "DINE_IN"
                  ? "Dine-In"
                  : "Takeaway"}
              </p>
            </div>

            {order.type ===
              "DINE_IN" && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Table
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {order.tableNumber ||
                    "—"}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Payment
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {order.payment
                  ?.status || "Pending"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total
              </p>

              <p className="mt-1 font-bold text-orange-600">
                ₹{order.total}
              </p>
            </div>

          </div>

        </div>

        {/* Timeline */}
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">

          <h2 className="text-lg font-bold text-slate-900">
            Order Progress
          </h2>

          <div className="mt-7">

            {steps.map(
              (step, index) => {

                const state =
                  getStepStatus(
                    step.status
                  );

                const isLast =
                  index ===
                  steps.length - 1;

                return (
                  <div
                    key={step.status}
                    className="relative flex gap-4"
                  >

                    {/* Connector */}
                    {!isLast && (
                      <div
                        className={`absolute left-5 top-11 h-14 w-0.5 ${
                          state ===
                            "completed" ||
                          state ===
                            "current"
                            ? "bg-orange-500"
                            : "bg-slate-200"
                        }`}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                        state ===
                        "completed"
                          ? "bg-green-100 text-green-700"
                          : state ===
                            "current"
                          ? "bg-orange-500 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {step.icon}
                    </div>

                    {/* Content */}
                    <div className="pb-8">

                      <p
                        className={`font-bold ${
                          state ===
                            "upcoming"
                            ? "text-slate-400"
                            : "text-slate-900"
                        }`}
                      >
                        {step.title}
                      </p>

                      <p
                        className={`mt-1 text-sm ${
                          state ===
                            "upcoming"
                            ? "text-slate-400"
                            : "text-slate-500"
                        }`}
                      >
                        {step.description}
                      </p>

                      {state ===
                        "current" && (
                        <span className="mt-2 inline-block rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                          Current Status
                        </span>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

          {/* Cancelled */}
          {order.status ===
            "CANCELLED" && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-red-700">
              <p className="font-bold">
                This order has been
                cancelled.
              </p>
            </div>
          )}

        </div>

        {/* Auto Refresh */}
        <div className="rounded-2xl bg-orange-50 p-4 text-center">

          <p className="text-sm font-semibold text-orange-700">
            🔄 Order status updates
            automatically
          </p>

          <p className="mt-1 text-xs text-orange-600">
            Checking for updates every
            5 seconds.
          </p>

        </div>

        {/* Back */}
        <Link
          href="/"
          className="block w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Back to Home
        </Link>

      </div>
    </main>
  );
}

export default function TrackingPage() {
  return (
    <TrackingContent />
  );
}