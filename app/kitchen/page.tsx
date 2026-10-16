"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  menuItemName: string;
  quantity: number;
  unitPrice: string;
  total: string;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  type: "DINE_IN" | "TAKEAWAY";
  status:
    | "PENDING"
    | "ACCEPTED"
    | "PREPARING"
    | "READY"
    | "COMPLETED"
    | "CANCELLED";
  tableNumber: string | null;
  total: string;
  createdAt: string;
  payment: {
    method: "UPI" | "CASH";
    status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  } | null;
  items: OrderItem[];
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadOrders() {
    try {
      const response = await fetch("/api/counter/orders", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Failed to load kitchen orders:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    orderId: string,
    status: Order["status"]
  ) {
    try {
      setUpdating(orderId);

      const response = await fetch(
        `/api/counter/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        alert(data.error || "Failed to update order.");
        return;
      }

      await loadOrders();
    } catch (error) {
      console.error("Status update failed:", error);
      alert("Something went wrong.");
    } finally {
      setUpdating(null);
    }
  }

  useEffect(() => {
    loadOrders();

    const interval = setInterval(loadOrders, 5000);

    return () => clearInterval(interval);
  }, []);

  const pendingOrders = orders.filter(
    (order) => order.status === "PENDING"
  );

  const acceptedOrders = orders.filter(
    (order) => order.status === "ACCEPTED"
  );

  const preparingOrders = orders.filter(
    (order) => order.status === "PREPARING"
  );

  const readyOrders = orders.filter(
    (order) => order.status === "READY"
  );

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function OrderCard({ order }: { order: Order }) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">
              #{order.orderNumber}
            </h3>

            <p className="text-sm text-gray-500">
              {order.customerName}
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
            {order.type === "DINE_IN"
              ? `Table ${order.tableNumber}`
              : "Takeaway"}
          </span>
        </div>

        <div className="mb-4 space-y-2 border-y py-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-sm"
            >
              <span>
                <strong>{item.quantity}×</strong>{" "}
                {item.menuItemName}
              </span>

              <span className="font-medium">
                ₹{item.total}
              </span>
            </div>
          ))}
        </div>

        <div className="mb-4 flex justify-between text-sm">
          <span className="text-gray-500">
            Payment
          </span>

          <span className="font-semibold">
            {order.payment?.method ?? "N/A"} ·{" "}
            {order.payment?.status ?? "N/A"}
          </span>
        </div>

        <div className="mb-4 flex justify-between">
          <span className="text-sm text-gray-500">
            Received {formatTime(order.createdAt)}
          </span>

          <span className="font-bold">
            ₹{order.total}
          </span>
        </div>

        {order.status === "PENDING" && (
          <button
            onClick={() =>
              updateStatus(order.id, "ACCEPTED")
            }
            disabled={updating === order.id}
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {updating === order.id
              ? "Updating..."
              : "Accept Order"}
          </button>
        )}

        {order.status === "ACCEPTED" && (
          <button
            onClick={() =>
              updateStatus(order.id, "PREPARING")
            }
            disabled={updating === order.id}
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {updating === order.id
              ? "Updating..."
              : "Start Preparing"}
          </button>
        )}

        {order.status === "PREPARING" && (
          <button
            onClick={() =>
              updateStatus(order.id, "READY")
            }
            disabled={updating === order.id}
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {updating === order.id
              ? "Updating..."
              : "Mark Ready"}
          </button>
        )}

        {order.status === "READY" && (
          <button
            onClick={() =>
              updateStatus(order.id, "COMPLETED")
            }
            disabled={updating === order.id}
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {updating === order.id
              ? "Updating..."
              : "Complete Order"}
          </button>
        )}
      </div>
    );
  }

  function Column({
    title,
    orders,
  }: {
    title: string;
    orders: Order[];
  }) {
    return (
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {title}
          </h2>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold">
            {orders.length}
          </span>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-gray-400">
              No orders
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
              />
            ))
          )}
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold">
            Kitchen
          </h1>

          <p className="mt-4 text-gray-500">
            Loading orders...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            VeerJi&apos;s Kulcha
          </p>

          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">
                Kitchen Orders
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Orders update automatically every 5 seconds.
              </p>
            </div>

            <button
              onClick={loadOrders}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm"
            >
              Refresh
            </button>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              New
            </p>
            <p className="mt-1 text-2xl font-bold">
              {pendingOrders.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Accepted
            </p>
            <p className="mt-1 text-2xl font-bold">
              {acceptedOrders.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Preparing
            </p>
            <p className="mt-1 text-2xl font-bold">
              {preparingOrders.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Ready
            </p>
            <p className="mt-1 text-2xl font-bold">
              {readyOrders.length}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          <Column
            title="New Orders"
            orders={pendingOrders}
          />

          <Column
            title="Accepted"
            orders={acceptedOrders}
          />

          <Column
            title="Preparing"
            orders={preparingOrders}
          />

          <Column
            title="Ready"
            orders={readyOrders}
          />
        </div>
      </div>
    </main>
  );
}