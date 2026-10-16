"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
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
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error("Dashboard loading failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    const interval = setInterval(loadOrders, 10000);

    return () => clearInterval(interval);
  }, []);

  const today = new Date();

  const todayOrders = orders.filter((order) => {
    const date = new Date(order.createdAt);

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  });

  const completedOrders = todayOrders.filter(
    (order) => order.status === "COMPLETED"
  );

  const activeOrders = todayOrders.filter(
    (order) =>
      order.status !== "COMPLETED" &&
      order.status !== "CANCELLED"
  );

  const preparingOrders = todayOrders.filter(
    (order) => order.status === "PREPARING"
  );

  const todaySales = completedOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  const averageOrderValue =
    completedOrders.length > 0
      ? todaySales / completedOrders.length
      : 0;

  const cards = [
    {
      label: "Today's Sales",
      value: `₹${todaySales.toLocaleString("en-IN")}`,
      description: "Completed orders",
    },
    {
      label: "Today's Orders",
      value: todayOrders.length,
      description: "All orders received",
    },
    {
      label: "Active Orders",
      value: activeOrders.length,
      description: "Currently in progress",
    },
    {
      label: "Preparing",
      value: preparingOrders.length,
      description: "In kitchen",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r bg-white p-5 md:block">
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-500">
              Restaurant Admin
            </p>

            <h1 className="mt-1 text-xl font-bold">
              VeerJi&apos;s Kulcha
            </h1>
          </div>

          <nav className="space-y-2">
            <Link
              href="/admin"
              className="block rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/kitchen"
              className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-100"
            >
              Orders / Kitchen
            </Link>

            <Link
              href="/counter"
              className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-100"
            >
              Counter
            </Link>

            <Link
              href="/menu"
              className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-100"
            >
              Menu
            </Link>

            <div className="pt-4">
              <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Management
              </p>

              <Link
                href="/admin/inventory"
                className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-100"
              >
                Inventory
              </Link>

              <Link
                href="/admin/sales"
                className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-100"
              >
                Sales & Analytics
              </Link>

              <Link
                href="/admin/bills"
                className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-100"
              >
                Bills
              </Link>

              <Link
                href="/admin/settings"
                className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-100"
              >
                Settings
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main */}
        <section className="flex-1">
          <header className="border-b bg-white px-5 py-5 md:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Good Evening 👋
                </p>

                <h2 className="text-2xl font-bold md:text-3xl">
                  Dashboard
                </h2>
              </div>

              <button
                onClick={loadOrders}
                className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm"
              >
                Refresh
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 p-5 md:p-8">
            {/* Stats */}
            <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  <p className="text-sm text-gray-500">
                    {card.label}
                  </p>

                  <p className="mt-2 text-2xl font-bold md:text-3xl">
                    {loading ? "—" : card.value}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {card.description}
                  </p>
                </div>
              ))}
            </section>

            {/* Overview */}
            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      Today&apos;s Overview
                    </h3>

                    <p className="text-sm text-gray-500">
                      Live restaurant activity
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">
                      Completed
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {completedOrders.length}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">
                      Active
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {activeOrders.length}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">
                      Avg. Order
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      ₹{Math.round(averageOrderValue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6">
                <h3 className="text-lg font-bold">
                  Quick Actions
                </h3>

                <div className="mt-5 space-y-3">
                  <Link
                    href="/kitchen"
                    className="block rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Open Kitchen
                  </Link>

                  <Link
                    href="/counter"
                    className="block rounded-xl border px-4 py-3 text-center text-sm font-semibold"
                  >
                    Open Counter
                  </Link>
                </div>
              </div>
            </section>

            {/* Recent Orders */}
            <section className="rounded-2xl border bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    Recent Orders
                  </h3>

                  <p className="text-sm text-gray-500">
                    Latest restaurant activity
                  </p>
                </div>

                <Link
                  href="/kitchen"
                  className="text-sm font-semibold"
                >
                  View Kitchen →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="border-b text-sm text-gray-500">
                      <th className="pb-3">Order</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.slice(0, 8).map((order) => (
                      <tr
                        key={order.id}
                        className="border-b last:border-0"
                      >
                        <td className="py-4 font-semibold">
                          {order.orderNumber}
                        </td>

                        <td className="py-4">
                          {order.customerName}
                        </td>

                        <td className="py-4 text-sm">
                          {order.type === "DINE_IN"
                            ? `Dine-In · ${order.tableNumber}`
                            : "Takeaway"}
                        </td>

                        <td className="py-4 font-semibold">
                          ₹{order.total}
                        </td>

                        <td className="py-4">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}