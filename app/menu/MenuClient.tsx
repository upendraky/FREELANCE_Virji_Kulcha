"use client";



import {

  ArrowLeft,

  Check,

  ChevronRight,

  Clock3,

  Flame,

  Minus,

  Plus,

  ShoppingBag,

  Sparkles,

  Utensils,

} from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import { useEffect, useMemo, useState } from "react";



type MenuItem = {

  id: string;

  name: string;

  description: string | null;

  price: number | null;

  imageUrl: string | null;

  categoryId: string;

  categoryName: string;

  isAvailable: boolean;

};



type Category = {

  id: string;

  name: string;

};



type Cart = Record<string, number>;



export default function MenuClient() {

  const router = useRouter();

  const searchParams = useSearchParams();



  const customerName = searchParams.get("name") || "";

  const orderType = searchParams.get("type") || "dine-in";

  const table = searchParams.get("table") || "";
  const qrToken = searchParams.get("qrToken") || "";



  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [cart, setCart] = useState<Cart>({});

  const [cartLoaded, setCartLoaded] = useState(false);

  const [activeCategory, setActiveCategory] = useState("all");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  /* ---------------- CART LOAD ---------------- */



  useEffect(() => {

    try {

      const savedCart = localStorage.getItem("veerjis-cart");



      if (savedCart) {

        const parsed = JSON.parse(savedCart);



        if (

          parsed &&

          typeof parsed === "object" &&

          !Array.isArray(parsed)

        ) {

          setCart(parsed);

        }

      }

    } catch {

      localStorage.removeItem("veerjis-cart");

    } finally {

      setCartLoaded(true);

    }

  }, []);



  /* ---------------- CART SAVE ---------------- */



  useEffect(() => {

    if (!cartLoaded) return;



    localStorage.setItem("veerjis-cart", JSON.stringify(cart));

  }, [cart, cartLoaded]);



  /* ---------------- MENU LOAD ---------------- */



  useEffect(() => {

    async function loadMenu() {

      try {

        setLoading(true);

        setError("");



        const response = await fetch("/api/menu", {

          cache: "no-store",

        });



        if (!response.ok) {

          throw new Error("Unable to load menu");

        }



        const data = await response.json();



        setMenuItems(data.items || []);

        setCategories(data.categories || []);

      } catch {

        setError("We couldn't load the menu. Please try again.");

      } finally {

        setLoading(false);

      }

    }



    loadMenu();

  }, []);



  /* ---------------- CATEGORIES ---------------- */



  const visibleCategories = useMemo(() => {

    return [

      {

        id: "all",

        name: "All",

      },

      ...categories.map((category) => ({

        id: category.id,

        name: category.name === "Breads" ? "Naan" : category.name,

      })),

    ];

  }, [categories]);



  /* ---------------- FILTER ---------------- */



  const filteredItems = useMemo(() => {

    if (activeCategory === "all") {

      return menuItems;

    }



    return menuItems.filter(

      (item) => item.categoryId === activeCategory

    );

  }, [menuItems, activeCategory]);



  /* ---------------- CART TOTALS ---------------- */



  const cartCount = useMemo(() => {

    return Object.values(cart).reduce(

      (total, quantity) => total + quantity,

      0

    );

  }, [cart]);



  const cartTotal = useMemo(() => {

    return menuItems.reduce((total, item) => {

      const quantity = cart[item.id] || 0;



      return total + Number(item.price || 0) * quantity;

    }, 0);

  }, [cart, menuItems]);



  /* ---------------- QUANTITY ---------------- */



  function updateQuantity(item: MenuItem, change: number) {

    if (!item.isAvailable) return;



    setCart((current) => {

      const nextQuantity = Math.max(

        0,

        (current[item.id] || 0) + change

      );



      const next = { ...current };



      if (nextQuantity === 0) {

        delete next[item.id];

      } else {

        next[item.id] = nextQuantity;

      }



      return next;

    });

  }



  /* ---------------- NAVIGATION ---------------- */



  function getParams() {

    const params = new URLSearchParams();



    if (customerName) {

      params.set("name", customerName);

    }



    params.set("type", orderType);



    if (table) {

      params.set("table", table);

    }

    if (qrToken) {
      params.set("qrToken", qrToken);
    }

    return params;

  }



  function openCart() {

    router.push(`/cart?${getParams().toString()}`);

  }



  function goBack() {

    router.back();

  }



  const orderLabel =

    orderType === "takeaway" ? "Takeaway" : "Dine-In";



  return (

    <main className="min-h-screen bg-[#FFF9F3] pb-28 text-[#2D1713]">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-[#EAD8CA] bg-[#FFF9F3]/95 backdrop-blur-xl">

        <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-between px-4 sm:px-6">

          <button

            onClick={goBack}

            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E7D5C7] active:scale-95"

          >

            <ArrowLeft size={19} />

          </button>



          <div className="text-center">

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B92B27]">

              VEERJI'S

            </p>



            <h1 className="text-[17px] font-black sm:text-lg">

              Our Menu

            </h1>

          </div>



          <button

            onClick={openCart}

            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B92B27] text-white shadow-sm active:scale-95"

          >

            <ShoppingBag size={18} />



            {cartCount > 0 && (

              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#FFF9F3] bg-[#F2A900] px-1 text-[10px] font-black text-[#2D1713]">

                {cartCount}

              </span>

            )}

          </button>

        </div>

      </header>



      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* ORDER CONTEXT */}

        <section className="pt-5">

          <div className="flex items-center gap-2 text-xs font-bold text-[#80665B] sm:text-sm">

            <Utensils size={14} />



            <span>{orderLabel}</span>



            {orderType === "dine-in" && table && (

              <>

                <span className="text-[#C8AFA0]">•</span>

                <span>Table {table}</span>

              </>

            )}

          </div>



          <div className="mt-2">

            <p className="text-sm font-medium text-[#A56A55]">

              {customerName

                ? `Welcome, ${customerName} 👋`

                : "Welcome 👋"}

            </p>



            <h2 className="mt-1 text-[30px] font-black leading-[1.08] tracking-tight sm:text-4xl">

              What are you

              <span className="text-[#B92B27]"> craving?</span>

            </h2>



            <p className="mt-2 max-w-xl text-xs leading-5 text-[#80665B] sm:text-sm">

              Fresh Punjabi favourites, prepared hot and served with

              love.

            </p>

          </div>

        </section>



        {/* HERO */}

        <section className="mt-5 overflow-hidden rounded-2xl bg-[#8E211F] shadow-sm sm:rounded-3xl">

          <div className="relative px-5 py-5 sm:px-8 sm:py-8">

            <div className="absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[#D99224]/20" />



            <div className="relative">

              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-[#FFE6B3] sm:text-xs">

                <Sparkles size={12} />

                Fresh from the tandoor

              </div>



              <h3 className="mt-3 text-xl font-black leading-tight text-white sm:text-3xl">

                Desi flavour.

                <br />

                Proper Punjabi soul.

              </h3>



              <p className="mt-2 max-w-md text-xs leading-5 text-white/70 sm:text-sm sm:leading-6">

                Order your favourites in just a few taps.

              </p>

            </div>

          </div>

        </section>



        {/* CATEGORIES */}

        <section className="sticky top-[64px] z-30 -mx-4 mt-4 bg-[#FFF9F3]/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">

          <div className="scrollbar-none flex gap-2 overflow-x-auto">

            {visibleCategories.map((category) => {

              const active = activeCategory === category.id;



              return (

                <button

                  key={category.id}

                  onClick={() =>

                    setActiveCategory(category.id)

                  }

                  className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold transition active:scale-95 ${

                    active

                      ? "bg-[#B92B27] text-white shadow-sm"

                      : "border border-[#E5D3C5] bg-white text-[#6E5147]"

                  }`}

                >

                  {category.name}

                </button>

              );

            })}

          </div>

        </section>



        {/* MENU */}

        <section className="mt-2">

          {loading ? (

            <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">

              {[1, 2, 3, 4].map((item) => (

                <div

                  key={item}

                  className="h-[145px] animate-pulse rounded-2xl bg-white ring-1 ring-[#EBD9CC] sm:h-[400px]"

                />

              ))}

            </div>

          ) : error ? (

            <div className="rounded-2xl border border-[#E8C9C1] bg-white p-7 text-center">

              <h3 className="font-black">

                Something went wrong

              </h3>



              <p className="mt-1 text-sm text-[#80665B]">

                {error}

              </p>



              <button

                onClick={() => window.location.reload()}

                className="mt-4 rounded-xl bg-[#B92B27] px-5 py-2.5 text-sm font-bold text-white"

              >

                Try again

              </button>

            </div>

          ) : filteredItems.length === 0 ? (

            <div className="rounded-2xl border border-[#EBD9CC] bg-white p-8 text-center">

              <Utensils

                size={25}

                className="mx-auto text-[#B92B27]"

              />



              <h3 className="mt-3 font-black">

                Nothing here yet

              </h3>



              <p className="mt-1 text-sm text-[#80665B]">

                Try another category.

              </p>

            </div>

          ) : (

            <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">

              {filteredItems.map((item) => {

                const quantity = cart[item.id] || 0;

                const price = Number(item.price || 0);



                const isPopular =

                  item.name

                    .toLowerCase()

                    .includes("mix kulcha");



                return (

                  <article

                    key={item.id}

                    className="group overflow-hidden rounded-2xl border border-[#EBD9CC] bg-white shadow-[0_3px_14px_rgba(89,45,28,0.05)] sm:rounded-3xl"

                  >

                    {/* MOBILE CARD */}

                    <div className="flex gap-3 p-3 sm:hidden">

                      {/* IMAGE */}

                      <div className="relative h-[112px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-[#F1E1D6]">

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



                        {isPopular && (

                          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-[#FFF5DA] px-2 py-1 text-[9px] font-black text-[#8B5A00]">

                            <Flame size={10} />

                            Popular

                          </span>

                        )}



                        {!item.isAvailable && (

                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">

                            <span className="px-2 text-center text-[10px] font-black text-white">

                              Unavailable

                            </span>

                          </div>

                        )}

                      </div>



                      {/* CONTENT */}

                      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">

                        <div>

                          <div className="flex items-start justify-between gap-2">

                            <h3 className="line-clamp-2 text-[15px] font-black leading-5">

                              {item.name}

                            </h3>



                            <span className="shrink-0 text-[15px] font-black text-[#B92B27]">

                              ₹{price}

                            </span>

                          </div>



                          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#80665B]">

                            {item.description ||

                              "Freshly prepared and full of flavour."}

                          </p>

                        </div>



                        <div className="mt-2 flex items-center justify-between">

                          <div className="flex items-center gap-1 text-[9px] font-semibold text-[#9A8074]">

                            <Clock3 size={10} />

                            Fresh

                          </div>



                          {!item.isAvailable ? (

                            <span className="rounded-lg bg-[#EEE7E2] px-3 py-2 text-[10px] font-bold text-[#9B8A82]">

                              Unavailable

                            </span>

                          ) : quantity === 0 ? (

                            <button

                              onClick={() =>

                                updateQuantity(item, 1)

                              }

                              className="flex min-h-9 items-center gap-1 rounded-lg bg-[#B92B27] px-4 text-xs font-black text-white active:scale-95"

                            >

                              Add

                              <Plus size={14} />

                            </button>

                          ) : (

                            <div className="flex h-9 overflow-hidden rounded-lg border border-[#E0C8BA] bg-[#FFF8F3]">

                              <button

                                onClick={() =>

                                  updateQuantity(item, -1)

                                }

                                className="flex w-9 items-center justify-center text-[#B92B27]"

                              >

                                <Minus size={14} />

                              </button>



                              <span className="flex min-w-8 items-center justify-center text-xs font-black">

                                {quantity}

                              </span>



                              <button

                                onClick={() =>

                                  updateQuantity(item, 1)

                                }

                                className="flex w-9 items-center justify-center bg-[#B92B27] text-white"

                              >

                                <Plus size={14} />

                              </button>

                            </div>

                          )}

                        </div>

                      </div>

                    </div>



                    {/* TABLET / DESKTOP CARD */}

                    <div className="hidden sm:block">

                      <div className="relative h-56 overflow-hidden bg-[#F1E1D6]">

                        {item.imageUrl ? (

                          <img

                            src={item.imageUrl}

                            alt={item.name}

                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"

                          />

                        ) : (

                          <div className="flex h-full items-center justify-center text-5xl">

                            🍽️

                          </div>

                        )}



                        {isPopular && (

                          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-[#FFF5DA] px-3 py-1.5 text-xs font-black text-[#8B5A00]">

                            <Flame size={13} />

                            Popular

                          </div>

                        )}



                        {!item.isAvailable && (

                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">

                            <span className="rounded-full bg-white px-4 py-2 text-sm font-black">

                              Currently Unavailable

                            </span>

                          </div>

                        )}

                      </div>



                      <div className="p-5">

                        <div className="flex items-start justify-between gap-4">

                          <div>

                            <h3 className="text-lg font-black">

                              {item.name}

                            </h3>



                            <p className="mt-1 text-sm leading-5 text-[#80665B]">

                              {item.description ||

                                "Freshly prepared and full of flavour."}

                            </p>

                          </div>



                          <span className="text-lg font-black text-[#B92B27]">

                            ₹{price}

                          </span>

                        </div>



                        <div className="mt-5 flex items-center justify-between">

                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#94766A]">

                            <Clock3 size={13} />

                            Freshly prepared

                          </div>



                          {!item.isAvailable ? (

                            <span className="rounded-xl bg-[#EEE7E2] px-5 py-2.5 text-sm font-bold text-[#A08F87]">

                              Unavailable

                            </span>

                          ) : quantity === 0 ? (

                            <button

                              onClick={() =>

                                updateQuantity(item, 1)

                              }

                              className="flex items-center gap-2 rounded-xl bg-[#B92B27] px-5 py-2.5 text-sm font-black text-white active:scale-95"

                            >

                              Add

                              <Plus size={16} />

                            </button>

                          ) : (

                            <div className="flex h-10 overflow-hidden rounded-xl border border-[#E0C8BA] bg-[#FFF8F3]">

                              <button

                                onClick={() =>

                                  updateQuantity(item, -1)

                                }

                                className="flex w-10 items-center justify-center text-[#B92B27]"

                              >

                                <Minus size={16} />

                              </button>



                              <span className="flex min-w-10 items-center justify-center text-sm font-black">

                                {quantity}

                              </span>



                              <button

                                onClick={() =>

                                  updateQuantity(item, 1)

                                }

                                className="flex w-10 items-center justify-center bg-[#B92B27] text-white"

                              >

                                <Plus size={16} />

                              </button>

                            </div>

                          )}

                        </div>



                        {quantity > 0 && (

                          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#37805B]">

                            <Check size={13} />

                            Added to your order

                          </div>

                        )}

                      </div>

                    </div>

                  </article>

                );

              })}

            </div>

          )}

        </section>

      </div>



      {/* FLOATING CART */}

      {cartCount > 0 && (

        <div className="fixed bottom-3 left-0 right-0 z-50 px-3 sm:bottom-5 sm:px-4">

          <button

            onClick={openCart}

            className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-2xl bg-[#B92B27] px-4 py-3 text-white shadow-[0_12px_35px_rgba(98,25,22,0.25)] active:scale-[0.99]"

          >

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">

                <ShoppingBag size={18} />

              </div>



              <div className="text-left">

                <p className="text-[10px] text-white/70">

                  Your order

                </p>



                <p className="text-sm font-black">

                  {cartCount}{" "}

                  {cartCount === 1 ? "item" : "items"} · ₹

                  {cartTotal}

                </p>

              </div>

            </div>



            <div className="flex items-center gap-1 text-xs font-black sm:text-sm">

              View cart

              <ChevronRight size={17} />

            </div>

          </button>

        </div>

      )}

    </main>

  );

}