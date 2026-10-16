"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Payment = {
  id: string;
  method: "UPI" | "CASH";
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  amount: string;
  transactionId: string | null;
  paidAt: string | null;
};

type OrderItem = {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: string;
  total: string;
};

type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  type: "DINE_IN" | "TAKEAWAY";
  status: OrderStatus;
  tableId: string | null;
  tableNumber: string | null;
  total: string;
  createdAt: string;
  payment: Payment | null;
  items: OrderItem[];
};

export default function CounterPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [generatingBill, setGeneratingBill] =
    useState<string | null>(null);

  const [receivingCash, setReceivingCash] =
    useState<string | null>(null);

  const [updatingStatus, setUpdatingStatus] =
    useState<string | null>(null);

  async function loadOrders() {
    try {
      const response = await fetch(
        "/api/counter/orders",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Failed to load orders."
        );
      }

      setOrders(data.orders);
    } catch (error) {
      console.error(
        "Failed to load orders:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    const interval = setInterval(
      loadOrders,
      10000
    );

    return () => clearInterval(interval);
  }, []);

  const filteredOrders = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return orders;
    }

    return orders.filter((order) => {
      return (
        order.orderNumber
          .toLowerCase()
          .includes(value) ||
        order.customerName
          .toLowerCase()
          .includes(value) ||
        order.customerPhone.includes(value) ||
        (order.tableNumber ?? "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [orders, search]);

  const pendingOrders = orders.filter(
    (order) =>
      order.status === "PENDING"
  ).length;

  const pendingPayments = orders.filter(
    (order) =>
      order.payment?.status === "PENDING"
  ).length;

  const preparingOrders = orders.filter(
    (order) =>
      order.status === "PREPARING"
  ).length;

  const readyOrders = orders.filter(
    (order) =>
      order.status === "READY"
  ).length;

  /*
   * UPDATE ORDER STATUS
   */
  async function updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ) {
    try {
      setUpdatingStatus(orderId);

      const response = await fetch(
        `/api/counter/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
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
            "Failed to update order status."
        );
      }

      await loadOrders();
    } catch (error) {
      console.error(
        "Order status update failed:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update order status."
      );
    } finally {
      setUpdatingStatus(null);
    }
  }

  /*
   * RECEIVE CASH
   */
  async function receiveCash(
    orderId: string
  ) {
    try {
      setReceivingCash(orderId);

      const response = await fetch(
        `/api/counter/orders/${orderId}/cash`,
        {
          method: "POST",
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
            "Failed to receive cash."
        );
      }

      await loadOrders();
    } catch (error) {
      console.error(
        "Cash payment failed:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to receive cash."
      );
    } finally {
      setReceivingCash(null);
    }
  }

  /*
   * GENERATE BILL
   */
  async function generateBill(
    orderId: string
  ) {
    try {
      setGeneratingBill(orderId);

      const response = await fetch(
        `/api/counter/orders/${orderId}/bill`,
        {
          method: "POST",
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
            "Failed to generate bill."
        );
      }

      router.push(
        `/counter/bills/${orderId}`
      );
    } catch (error) {
      console.error(
        "Bill generation failed:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate bill."
      );
    } finally {
      setGeneratingBill(null);
    }
  }

  /*
   * STATUS LABEL
   */
  function statusLabel(
    status: OrderStatus
  ) {
    switch (status) {
      case "PENDING":
        return "Pending";

      case "ACCEPTED":
        return "Accepted";

      case "PREPARING":
        return "Preparing";

      case "READY":
        return "Ready";

      case "COMPLETED":
        return "Completed";

      case "CANCELLED":
        return "Cancelled";

      default:
        return status;
    }
  }

  /*
   * STATUS COLOR
   */
  function statusClass(
    status: OrderStatus
  ) {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";

      case "ACCEPTED":
        return "bg-blue-100 text-blue-700";

      case "PREPARING":
        return "bg-orange-100 text-orange-700";

      case "READY":
        return "bg-green-100 text-green-700";

      case "COMPLETED":
        return "bg-slate-100 text-slate-700";

      case "CANCELLED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-slate-600">
              Loading counter orders...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <div>
          <p className="text-sm font-semibold tracking-wide text-orange-600">
            VEERJI&apos;S KULCHA
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Counter Operations
          </h1>

          <p className="mt-1 text-slate-500">
            Manage payments, orders and bills.
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Orders
            </p>

            <p className="mt-2 text-3xl font-bold">
              {orders.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {pendingOrders}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Pending Payments
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {pendingPayments}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Preparing
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-600">
              {preparingOrders}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Ready
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {readyOrders}
            </p>
          </div>

        </div>

        {/* SEARCH */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search Order ID, customer, phone or table..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        {/* ORDERS */}
        <div className="space-y-4">

          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-700">
                No orders found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try another search.
              </p>
            </div>
          ) : (
            filteredOrders.map(
              (order) => {

                const paymentPending =
                  order.payment?.status ===
                  "PENDING";

                const paymentPaid =
                  order.payment?.status ===
                  "PAID";

                const isGenerating =
                  generatingBill ===
                  order.id;

                const isReceivingCash =
                  receivingCash ===
                  order.id;

                const isUpdating =
                  updatingStatus ===
                  order.id;

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >

                    {/* TOP */}
                    <div className="flex flex-col justify-between gap-5 md:flex-row">

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="text-xl font-bold text-slate-900">
                            #{order.orderNumber}
                          </h2>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                              order.status
                            )}`}
                          >
                            {statusLabel(
                              order.status
                            )}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              order.type ===
                              "DINE_IN"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {order.type ===
                            "DINE_IN"
                              ? "DINE-IN"
                              : "TAKEAWAY"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              paymentPaid
                                ? "bg-green-100 text-green-700"
                                : paymentPending
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {order.payment
                              ?.status ??
                              "UNKNOWN"}
                          </span>

                        </div>

                        <p className="mt-3 text-slate-700">
                          Customer:{" "}
                          <strong>
                            {order.customerName}
                          </strong>
                        </p>

                        <p className="text-sm text-slate-500">
                          {order.customerPhone}
                        </p>

                        {order.type ===
                          "DINE_IN" && (
                          <p className="mt-1 text-sm font-medium text-slate-600">
                            Table:{" "}
                            <strong>
                              {order.tableNumber ??
                                "—"}
                            </strong>
                          </p>
                        )}

                      </div>

                      {/* TOTAL */}
                      <div className="text-left md:text-right">

                        <p className="text-sm text-slate-500">
                          Total
                        </p>

                        <p className="text-2xl font-bold text-slate-900">
                          ₹{order.total}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {order.payment
                            ?.method ===
                          "CASH"
                            ? "Cash at Counter"
                            : "UPI"}
                        </p>

                      </div>

                    </div>

                    {/* ITEMS */}
                    <div className="mt-5 border-t border-slate-100 pt-4">

                      <p className="mb-3 text-sm font-bold text-slate-700">
                        Ordered Items
                      </p>

                      <div className="space-y-2">

                        {order.items.map(
                          (item) => (
                            <div
                              key={item.id}
                              className="flex justify-between gap-4 text-sm"
                            >
                              <span className="text-slate-600">
                                {item.quantity} ×{" "}
                                {
                                  item.menuItemName
                                }
                              </span>

                              <span className="font-semibold text-slate-800">
                                ₹{item.total}
                              </span>
                            </div>
                          )
                        )}

                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-5 flex flex-wrap gap-3">

                      {/* RECEIVE CASH */}
                      {paymentPending &&
                        order.payment
                          ?.method ===
                          "CASH" && (
                          <button
                            type="button"
                            disabled={
                              isReceivingCash
                            }
                            onClick={() =>
                              receiveCash(
                                order.id
                              )
                            }
                            className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {isReceivingCash
                              ? "Receiving..."
                              : "✓ Receive Cash"}
                          </button>
                        )}

                      {/* ACCEPT */}
                      {paymentPaid &&
                        order.status ===
                          "PENDING" && (
                          <button
                            type="button"
                            disabled={
                              isUpdating
                            }
                            onClick={() =>
                              updateOrderStatus(
                                order.id,
                                "ACCEPTED"
                              )
                            }
                            className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isUpdating
                              ? "Updating..."
                              : "✓ Accept Order"}
                          </button>
                        )}

                      {/* PREPARING */}
                      {order.status ===
                        "ACCEPTED" && (
                        <button
                          type="button"
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              "PREPARING"
                            )
                          }
                          className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                        >
                          {isUpdating
                            ? "Updating..."
                            : "👨‍🍳 Start Preparing"}
                        </button>
                      )}

                      {/* READY */}
                      {order.status ===
                        "PREPARING" && (
                        <button
                          type="button"
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              "READY"
                            )
                          }
                          className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {isUpdating
                            ? "Updating..."
                            : "🎉 Mark Ready"}
                        </button>
                      )}

                      {/* COMPLETE */}
                      {order.status ===
                        "READY" && (
                        <button
                          type="button"
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              "COMPLETED"
                            )
                          }
                          className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          {isUpdating
                            ? "Updating..."
                            : "✓ Complete Order"}
                        </button>
                      )}

                      {/* BILL */}
                      {paymentPaid && (
                        <button
                          type="button"
                          disabled={
                            isGenerating
                          }
                          onClick={() =>
                            generateBill(
                              order.id
                            )
                          }
                          className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {isGenerating
                            ? "Generating..."
                            : "🧾 Generate Bill"}
                        </button>
                      )}

                      {/* PAYMENT STATUS */}
                      {paymentPending && (
                        <span className="flex items-center rounded-xl bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-700">
                          Payment Pending
                        </span>
                      )}

                      {paymentPaid && (
                        <span className="flex items-center rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                          ✓ Payment Received
                        </span>
                      )}

                    </div>

                  </div>
                );
              }
            )
          )}

        </div>
      </div>
    </main>
  );
}