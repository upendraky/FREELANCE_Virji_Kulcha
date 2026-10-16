"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type BillItem = {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: string;
  total: string;
};

type BillData = {
  bill: {
    id: string;
    billNumber: string;
    status: string;
    amount: string;
    generatedAt: string | null;
    printedAt: string | null;
  };

  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    type: "DINE_IN" | "TAKEAWAY";
    status: string;
    tableNumber: string | null;
    total: string;
    createdAt: string;
  };

  items: BillItem[];

  payment: {
    method: "UPI" | "CASH";
    status:
      | "PENDING"
      | "PAID"
      | "FAILED"
      | "REFUNDED";
    amount: string;
    transactionId: string | null;
    paidAt: string | null;
  } | null;
};

export default function BillDetailsPage() {
  const params = useParams();

  const orderId = String(params.orderId);

  const [data, setData] =
    useState<BillData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadBill() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/counter/orders/${orderId}/bill`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "Failed to load bill."
        );
      }

      setData(result);
    } catch (error) {
      console.error(
        "Bill loading failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load bill."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (orderId) {
      loadBill();
    }
  }, [orderId]);

  function printBill() {
    window.print();
  }

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">
            Loading bill...
          </p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">

          <p className="text-lg font-bold text-red-600">
            Unable to load bill
          </p>

          <p className="mt-2 text-slate-500">
            {error ||
              "Bill information was not found."}
          </p>

          <Link
            href="/counter"
            className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
          >
            Back to Counter
          </Link>

        </div>
      </main>
    );
  }

  const {
    bill,
    order,
    items,
    payment,
  } = data;

  return (
    <>
      {/* ================================================= */}
      {/* SCREEN VERSION */}
      {/* ================================================= */}

      <main className="min-h-screen bg-slate-100 px-4 py-6 md:px-8 print:hidden">

        <div className="mx-auto max-w-4xl space-y-6">

          {/* HEADER */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <p className="text-sm font-bold tracking-widest text-orange-600">
                VEERJI&apos;S KULCHA
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Bill Details
              </h1>

              <p className="mt-1 text-slate-500">
                Final restaurant bill
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href="/counter"
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                ← Back to Counter
              </Link>

              <button
                type="button"
                onClick={printBill}
                className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-sm hover:bg-slate-800"
              >
                🖨 Print Bill
              </button>

            </div>

          </div>

          {/* BILL CARD */}
          <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">

            {/* RESTAURANT */}
            <div className="border-b border-slate-200 pb-6 text-center">

              <p className="text-2xl font-black tracking-wide text-slate-900">
                VEERJI&apos;S KULCHA
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Restaurant Bill
              </p>

            </div>

            {/* BILL INFORMATION */}
            <div className="grid gap-5 border-b border-slate-200 py-6 sm:grid-cols-2">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Bill Number
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {bill.billNumber}
                </p>
              </div>

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

                <p className="text-sm text-slate-500">
                  {order.customerPhone}
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

                {order.type ===
                  "DINE_IN" &&
                  order.tableNumber && (
                    <p className="text-sm text-slate-500">
                      Table{" "}
                      {order.tableNumber}
                    </p>
                  )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Generated
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatDate(
                    bill.generatedAt
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Order Status
                </p>

                <p className="mt-1 font-bold text-green-600">
                  {order.status}
                </p>
              </div>

            </div>

            {/* ITEMS */}
            <div className="py-6">

              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Items
              </h2>

              <div className="space-y-4">

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4"
                  >

                    <div>

                      <p className="font-semibold text-slate-800">
                        {item.name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {item.quantity} × ₹
                        {item.unitPrice}
                      </p>

                    </div>

                    <p className="font-bold text-slate-900">
                      ₹{item.total}
                    </p>

                  </div>
                ))}

              </div>

            </div>

            {/* TOTAL */}
            <div className="border-t border-slate-200 pt-5">

              <div className="flex justify-between text-slate-600">
                <span>
                  Subtotal
                </span>

                <span>
                  ₹{order.total}
                </span>
              </div>

              <div className="mt-4 flex justify-between text-xl font-black text-slate-900">

                <span>
                  Grand Total
                </span>

                <span className="text-orange-600">
                  ₹{order.total}
                </span>

              </div>

            </div>

            {/* PAYMENT */}
            <div className="mt-6 rounded-2xl bg-slate-50 p-5">

              <h2 className="font-bold text-slate-900">
                Payment
              </h2>

              <div className="mt-3 flex flex-wrap gap-3">

                <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  {payment?.method ===
                  "CASH"
                    ? "Cash"
                    : "UPI"}
                </span>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    payment?.status ===
                    "PAID"
                      ? "bg-green-100 text-green-700"
                      : payment?.status ===
                        "FAILED"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {payment?.status ??
                    "UNKNOWN"}
                </span>

              </div>

              {payment?.paidAt && (
                <p className="mt-3 text-sm text-slate-500">
                  Paid:{" "}
                  {formatDate(
                    payment.paidAt
                  )}
                </p>
              )}

            </div>

            {/* FOOTER */}
            <div className="mt-8 border-t border-slate-200 pt-6 text-center">

              <p className="font-semibold text-slate-700">
                Thank you for visiting
                VeerJi&apos;s Kulcha 🙏
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please retain this bill for
                your records.
              </p>

            </div>

          </div>

        </div>

      </main>

      {/* ================================================= */}
      {/* 80MM THERMAL RECEIPT */}
      {/* ================================================= */}

      <div className="thermal-receipt">

        <div className="receipt-center">

          <div className="receipt-title">
            VEERJI&apos;S KULCHA
          </div>

          <div>
            RESTAURANT BILL
          </div>

          <div className="receipt-divider">
            --------------------------------
          </div>

        </div>

        <div className="receipt-row">
          <span>Bill:</span>

          <strong>
            {bill.billNumber}
          </strong>
        </div>

        <div className="receipt-row">
          <span>Order:</span>

          <strong>
            {order.orderNumber}
          </strong>
        </div>

        <div className="receipt-row">
          <span>Customer:</span>

          <strong>
            {order.customerName}
          </strong>
        </div>

        <div className="receipt-row">
          <span>Type:</span>

          <strong>
            {order.type ===
            "DINE_IN"
              ? "DINE-IN"
              : "TAKEAWAY"}
          </strong>
        </div>

        {order.type ===
          "DINE_IN" &&
          order.tableNumber && (
            <div className="receipt-row">
              <span>Table:</span>

              <strong>
                {order.tableNumber}
              </strong>
            </div>
          )}

        <div className="receipt-row">
          <span>Time:</span>

          <span>
            {formatDate(
              bill.generatedAt
            )}
          </span>
        </div>

        <div className="receipt-divider">
          --------------------------------
        </div>

        <div className="receipt-items-header">
          <span>
            ITEM
          </span>

          <span>
            AMOUNT
          </span>
        </div>

        {items.map((item) => (
          <div
            key={item.id}
            className="receipt-item"
          >

            <div>
              <div>
                {item.name}
              </div>

              <div className="receipt-small">
                {item.quantity} × ₹
                {item.unitPrice}
              </div>
            </div>

            <strong>
              ₹{item.total}
            </strong>

          </div>
        ))}

        <div className="receipt-divider">
          --------------------------------
        </div>

        <div className="receipt-row">
          <span>
            Subtotal
          </span>

          <strong>
            ₹{order.total}
          </strong>
        </div>

        <div className="receipt-row receipt-total">
          <span>
            TOTAL
          </span>

          <strong>
            ₹{order.total}
          </strong>
        </div>

        <div className="receipt-divider">
          --------------------------------
        </div>

        <div className="receipt-center">

          <div>
            PAYMENT
          </div>

          <strong>
            {payment?.method ===
            "CASH"
              ? "CASH"
              : "UPI"}
          </strong>

          <div>
            STATUS:{" "}
            {payment?.status ??
              "UNKNOWN"}
          </div>

          <div className="receipt-divider">
            --------------------------------
          </div>

          <strong>
            THANK YOU 🙏
          </strong>

          <div>
            Visit Again!
          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* PRINT CSS */}
      {/* ================================================= */}

      <style jsx global>{`
        .thermal-receipt {
          display: none;
        }

        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          html,
          body {
            width: 80mm;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

          body {
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          /*
           * Hide normal website UI
           */
          body > * {
            visibility: hidden;
          }

          /*
           * Show only thermal receipt
           */
          .thermal-receipt {
            display: block;
            visibility: visible;

            width: 72mm;

            margin: 0 auto;
            padding: 5mm 2mm;

            box-sizing: border-box;

            color: #000000;
            background: #ffffff;

            font-family:
              "Courier New",
              Courier,
              monospace;

            font-size: 11px;
            line-height: 1.35;
          }

          .thermal-receipt * {
            visibility: visible;
          }

          .receipt-center {
            text-align: center;
          }

          .receipt-title {
            font-size: 17px;
            font-weight: 900;
            letter-spacing: 0.5px;
          }

          .receipt-divider {
            margin: 5px 0;

            white-space: nowrap;
            overflow: hidden;
          }

          .receipt-row {
            display: flex;
            justify-content: space-between;

            gap: 8px;
            margin: 3px 0;
          }

          .receipt-row span:first-child {
            flex-shrink: 0;
          }

          .receipt-row strong:last-child,
          .receipt-row span:last-child {
            text-align: right;
          }

          .receipt-items-header {
            display: flex;
            justify-content: space-between;

            font-weight: 900;

            margin-bottom: 5px;
          }

          .receipt-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;

            gap: 8px;
            margin: 6px 0;
          }

          .receipt-item > div:first-child {
            min-width: 0;
            max-width: 48mm;

            overflow-wrap: anywhere;
          }

          .receipt-item strong {
            white-space: nowrap;
          }

          .receipt-small {
            font-size: 10px;
          }

          .receipt-total {
            font-size: 15px;
            font-weight: 900;

            margin-top: 6px;
          }
        }
      `}</style>
    </>
  );
}