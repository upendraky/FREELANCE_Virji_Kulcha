"use client";

import {
  ArrowLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
  categoryName: string;
};

type Cart = Record<string, number>;

const CART_KEY = "veerjis-cart";

export default function CartClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderType = searchParams.get("type") || "dine-in";
  const customerName = searchParams.get("name") || "";
  const tableNumber = searchParams.get("table") || "";

  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [cartLoaded, setCartLoaded] = useState(false);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [error, setError] = useState("");

  /*
   * IMPORTANT:
   * Load cart FIRST.
   *
   * We do not persist until cartLoaded === true.
   * This prevents the initial {} state from overwriting
   * the real cart in localStorage.
   */
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_KEY);

      if (!savedCart) {
        setCart({});
        return;
      }

      const parsed = JSON.parse(savedCart);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        const cleanCart: Cart = {};

        for (const [id, quantity] of Object.entries(parsed)) {
          if (
            typeof quantity === "number" &&
            Number.isFinite(quantity) &&
            quantity > 0
          ) {
            cleanCart[id] = Math.floor(quantity);
          }
        }

        setCart(cleanCart);
      } else {
        setCart({});
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
      setCart({});
    } finally {
      setCartLoaded(true);
    }
  }, []);

  /*
   * Persist ONLY after the initial cart has been loaded.
   */
  useEffect(() => {
    if (!cartLoaded) {
      return;
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, cartLoaded]);

  /*
   * Load current menu from database.
   *
   * This keeps Cart and Checkout synchronized with
   * the restaurant's actual menu and prices.
   */
  useEffect(() => {
    async function loadMenu() {
      try {
        setError("");

        const response = await fetch("/api/menu", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load menu."
          );
        }

        setItems(data.items || []);
      } catch (error) {
        console.error("Failed to load menu:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load menu."
        );
      } finally {
        setMenuLoaded(true);
      }
    }

    loadMenu();
  }, []);

  /*
   * Only display cart items that still exist in the
   * current restaurant menu.
   */
  const cartItems = useMemo(() => {
    return items
      .filter((item) => {
        const quantity = cart[item.id];

        return (
          typeof quantity === "number" &&
          quantity > 0
        );
      })
      .map((item) => ({
        ...item,
        quantity: cart[item.id],
        total:
          Number(item.price || 0) *
          cart[item.id],
      }));
  }, [items, cart]);

  const totalItems = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.total,
      0
    );
  }, [cartItems]);

  function updateQuantity(
    itemId: string,
    quantity: number
  ) {
    setCart((current) => {
      const next = { ...current };

      if (quantity <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = quantity;
      }

      return next;
    });
  }

  function clearCart() {
    setCart({});
    localStorage.removeItem(CART_KEY);
  }

  function buildNavigationParams() {
    const params = new URLSearchParams();

    params.set("type", orderType);

    if (customerName) {
      params.set("name", customerName);
    }

    if (orderType === "dine-in" && tableNumber) {
      params.set("table", tableNumber);
    }

    return params;
  }

  function goToMenu() {
    const params = buildNavigationParams();

    router.push(`/menu?${params.toString()}`);
  }

  function goToCheckout() {
    if (totalItems === 0) {
      return;
    }

    const params = buildNavigationParams();

    router.push(`/checkout?${params.toString()}`);
  }

  if (!cartLoaded || !menuLoaded) {
    return (
      <main className="min-h-screen bg-[#FFF9F3] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-[#EBD9CC] bg-white p-10 text-center shadow-sm">
            <ShoppingBag
              size={32}
              className="mx-auto text-[#B92B27]"
            />

            <p className="mt-4 text-sm font-semibold text-[#80665B]">
              Loading your order...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF9F3] pb-32 text-[#2D1713]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#EBD9CC] bg-[#FFF9F3]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E5D3C5] active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B92B27]">
              VEERJI&apos;S KULCHA
            </p>

            <h1 className="text-lg font-black">
              Your Cart
            </h1>
          </div>

          <button
            type="button"
            onClick={clearCart}
            disabled={totalItems === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#B92B27] shadow-sm ring-1 ring-[#E5D3C5] disabled:opacity-30"
            aria-label="Clear cart"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5">
        {/* ORDER CONTEXT */}
        <section className="rounded-2xl border border-[#EBD9CC] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E9] text-[#B92B27]">
              <Utensils size={20} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#9A8074]">
                Ordering for
              </p>

              <p className="truncate text-base font-black">
                {orderType === "takeaway"
                  ? "Takeaway"
                  : `Dine-In${
                      tableNumber
                        ? ` · Table ${tableNumber}`
                        : ""
                    }`}
              </p>
            </div>
          </div>
        </section>

        {/* CUSTOMER */}
        {customerName && (
          <p className="mt-4 text-sm text-[#80665B]">
            Customer:{" "}
            <span className="font-bold text-[#2D1713]">
              {customerName}
            </span>
          </p>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* EMPTY */}
        {totalItems === 0 ? (
          <section className="mt-6 rounded-3xl border border-[#EBD9CC] bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF0E9] text-[#B92B27]">
              <ShoppingBag size={34} />
            </div>

            <h2 className="mt-6 text-2xl font-black">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#80665B]">
              Add something delicious from our Punjabi
              kitchen to get started.
            </p>

            <button
              type="button"
              onClick={goToMenu}
              className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#B92B27] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-red-900/10 active:scale-95"
            >
              Browse Menu
              <ChevronRight size={17} />
            </button>
          </section>
        ) : (
          <>
            {/* TITLE */}
            <div className="mt-6">
              <p className="text-sm font-bold text-[#9A8074]">
                {totalItems}{" "}
                {totalItems === 1 ? "item" : "items"}
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight">
                Almost there 👋
              </h2>
            </div>

            {/* ITEMS */}
            <section className="mt-5 space-y-3">
              {cartItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#EBD9CC] bg-white p-3 shadow-sm"
                >
                  <div className="flex gap-3">
                    {/* IMAGE */}
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#F3E3D8]">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-base font-black">
                          {item.name}
                        </h3>

                        <p className="shrink-0 font-black text-[#B92B27]">
                          ₹{item.total}
                        </p>
                      </div>

                      <p className="mt-1 text-xs text-[#9A8074]">
                        ₹{Number(item.price || 0)} each
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              0
                            )
                          }
                          className="text-xs font-bold text-[#B92B27]"
                        >
                          Remove
                        </button>

                        <div className="flex h-9 items-center overflow-hidden rounded-xl border border-[#E2CEC0] bg-[#FFF9F3]">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity - 1
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center text-[#B92B27]"
                          >
                            <Minus size={15} />
                          </button>

                          <span className="min-w-8 text-center text-sm font-black">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center bg-[#B92B27] text-white"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {/* SUMMARY */}
            <section className="mt-5 rounded-2xl border border-[#EBD9CC] bg-white p-5 shadow-sm">
              <h3 className="font-black">
                Bill Summary
              </h3>

              <div className="mt-4 flex justify-between text-sm text-[#80665B]">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>

              <div className="my-4 border-t border-[#F0E3DA]" />

              <div className="flex items-center justify-between">
                <span className="text-base font-black">
                  Total
                </span>

                <span className="text-xl font-black text-[#B92B27]">
                  ₹{subtotal}
                </span>
              </div>
            </section>
          </>
        )}
      </div>

      {/* CHECKOUT BAR */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#EBD9CC] bg-[#FFF9F3]/95 p-3 backdrop-blur-xl">
          <div className="mx-auto max-w-3xl">
            <button
              type="button"
              onClick={goToCheckout}
              className="flex w-full items-center justify-between rounded-2xl bg-[#B92B27] px-5 py-4 text-white shadow-xl shadow-red-900/15 active:scale-[0.99]"
            >
              <div className="text-left">
                <p className="text-[11px] text-white/70">
                  {totalItems}{" "}
                  {totalItems === 1
                    ? "item"
                    : "items"}
                </p>

                <p className="text-base font-black">
                  ₹{subtotal}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-black">
                Proceed to Checkout
                <ChevronRight size={18} />
              </div>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}