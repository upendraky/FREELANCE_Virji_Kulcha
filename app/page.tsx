"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | null>(
    null
  );

  const continueOrder = () => {
    if (!orderType) return;
    router.push(`/order?type=${orderType}`);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#FFF9F3] text-[#241914]">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-red-200/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-orange-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#B92B27] text-2xl shadow-sm">
              🫓
            </div>

            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[#8F211E] sm:text-xl">
                VeerJi's Kulcha
              </h1>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Authentic Punjabi Taste
              </p>
            </div>
          </div>

          <div className="hidden rounded-full bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700 sm:block">
            Scan • Order • Enjoy
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="relative mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        {/* Hero */}
        <section className="mx-auto max-w-3xl pt-10 text-center sm:pt-16">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-semibold text-orange-700 shadow-sm">
            <span>🔥</span>
            Fresh • Hot • Made to Order
          </div>

          <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#D93A2B] to-[#A51F1B] text-5xl shadow-xl shadow-red-200/50">
            🫓
          </div>

          <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-[#241914] sm:text-5xl md:text-6xl">
            Welcome to
            <span className="mt-1 block text-[#B92B27]">
              VeerJi's Kulcha 👋
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
            Authentic Punjabi flavours, freshly prepared just for you.
            <span className="block">What would you like to order today?</span>
          </p>
        </section>

        {/* Order type */}
        <section className="mx-auto mt-10 max-w-3xl sm:mt-12">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
                Start your order
              </p>
              <h3 className="mt-1 text-xl font-extrabold sm:text-2xl">
                How are you enjoying it?
              </h3>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Dine-In */}
            <button
              onClick={() => setOrderType("dine-in")}
              className={`group relative overflow-hidden rounded-3xl border bg-white p-6 text-left shadow-sm transition-all duration-200 sm:p-7 ${
                orderType === "dine-in"
                  ? "border-[#B92B27] bg-[#FFF5F2] shadow-lg shadow-red-100"
                  : "border-orange-100 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
              }`}
            >
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-orange-100/50 blur-2xl transition-transform group-hover:scale-125" />

              <div className="relative">
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition ${
                    orderType === "dine-in"
                      ? "bg-[#B92B27] text-white"
                      : "bg-orange-50"
                  }`}
                >
                  🍽️
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-2xl font-extrabold">Dine-In</h4>

                  {orderType === "dine-in" && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#B92B27] text-sm text-white">
                      ✓
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Enjoy your meal fresh and hot at the restaurant.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-bold text-[#B92B27]">
                  <span>UPI</span>
                  <span className="text-gray-300">•</span>
                  <span>Cash at Counter</span>
                </div>
              </div>
            </button>

            {/* Takeaway */}
            <button
              onClick={() => setOrderType("takeaway")}
              className={`group relative overflow-hidden rounded-3xl border bg-white p-6 text-left shadow-sm transition-all duration-200 sm:p-7 ${
                orderType === "takeaway"
                  ? "border-[#B92B27] bg-[#FFF5F2] shadow-lg shadow-red-100"
                  : "border-orange-100 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
              }`}
            >
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-orange-100/50 blur-2xl transition-transform group-hover:scale-125" />

              <div className="relative">
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition ${
                    orderType === "takeaway"
                      ? "bg-[#B92B27] text-white"
                      : "bg-orange-50"
                  }`}
                >
                  🥡
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-2xl font-extrabold">Takeaway</h4>

                  {orderType === "takeaway" && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#B92B27] text-sm text-white">
                      ✓
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Order ahead and collect your food from the counter.
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-bold text-[#B92B27]">
                  <span>UPI Payment</span>
                  <span className="text-gray-300">•</span>
                  <span>Quick Pickup</span>
                </div>
              </div>
            </button>
          </div>

          {/* Continue */}
          <button
            onClick={continueOrder}
            disabled={!orderType}
            className={`mt-5 flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-base font-extrabold shadow-lg transition-all duration-200 ${
              orderType
                ? "bg-[#B92B27] text-white shadow-red-200 hover:-translate-y-0.5 hover:bg-[#9F211E] active:translate-y-0"
                : "cursor-not-allowed bg-gray-200 text-gray-400 shadow-none"
            }`}
          >
            {orderType === "dine-in"
              ? "Continue with Dine-In"
              : orderType === "takeaway"
                ? "Continue with Takeaway"
                : "Choose an Order Type"}

            {orderType && <span className="text-xl">→</span>}
          </button>
        </section>

        {/* Trust strip */}
        <section className="mx-auto mt-10 grid max-w-3xl grid-cols-3 divide-x divide-orange-100 rounded-2xl border border-orange-100 bg-white px-2 py-4 shadow-sm">
          <div className="px-2 text-center">
            <div className="text-lg">👨‍🍳</div>
            <p className="mt-1 text-[11px] font-bold text-gray-700 sm:text-xs">
              Freshly Prepared
            </p>
          </div>

          <div className="px-2 text-center">
            <div className="text-lg">⚡</div>
            <p className="mt-1 text-[11px] font-bold text-gray-700 sm:text-xs">
              Quick Ordering
            </p>
          </div>

          <div className="px-2 text-center">
            <div className="text-lg">❤️</div>
            <p className="mt-1 text-[11px] font-bold text-gray-700 sm:text-xs">
              Made with Love
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-orange-100 bg-white px-5 py-6 text-center">
        <p className="text-xs font-medium text-gray-400">
          Freshly prepared • Authentic Punjabi taste • VeerJi's Kulcha
        </p>
      </footer>
    </main>
  );
}