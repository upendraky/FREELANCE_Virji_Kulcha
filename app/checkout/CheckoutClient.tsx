"use client";



import { load } from "@cashfreepayments/cashfree-js";

import {

  ArrowLeft,

  Check,

  CreditCard,

  Minus,

  Plus,

  ShoppingBag,

  Wallet,

} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";



type PaymentMethod = "UPI" | "CASH";



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



function isValidIndianPhone(phone: string) {

  return /^[6-9]\d{9}$/.test(phone);

}



export default function CheckoutClient() {

  const router = useRouter();

  const searchParams = useSearchParams();



  const rawOrderType = (searchParams.get("type") || "dine-in").toLowerCase();
  const orderType = rawOrderType === "takeaway" ? "TAKEAWAY" : "DINE_IN";



  const [customerName, setCustomerName] = useState("");

const [notes, setNotes] = useState("");



  // Accept the common parameter names used by table QR links and navigation.
  const tableNumber =
    searchParams.get("table") ||
    searchParams.get("tableNumber") ||
    "";

  const qrToken =
    searchParams.get("qrToken") ||
    searchParams.get("qr") ||
    "";



  const [cart, setCart] = useState<Cart>({});

  const [items, setItems] = useState<MenuItem[]>([]);



  const [cartLoaded, setCartLoaded] = useState(false);

  const [menuLoaded, setMenuLoaded] = useState(false);



  const [phone, setPhone] = useState("");



  const [paymentMethod, setPaymentMethod] =

    useState<PaymentMethod>("UPI");



  const [creatingOrder, setCreatingOrder] =

    useState(false);



  const [error, setError] = useState("");



  /*

   * LOAD CART

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



        for (const [id, quantity] of Object.entries(

          parsed

        )) {

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

      console.error(

        "Failed to load checkout cart:",

        error

      );



      setCart({});

    } finally {

      setCartLoaded(true);

    }

  }, []);



  /*

   * LOAD CURRENT MENU

   */

  useEffect(() => {

    async function loadMenu() {

      try {

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

        console.error(

          "Failed to load checkout menu:",

          error

        );



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

   * PERSIST CART ONLY AFTER INITIAL LOAD

   */

  useEffect(() => {

    if (!cartLoaded) {

      return;

    }



    localStorage.setItem(

      CART_KEY,

      JSON.stringify(cart)

    );

  }, [cart, cartLoaded]);



  /*

   * TAKEAWAY = UPI ONLY

   */

  useEffect(() => {

    if (orderType === "TAKEAWAY") {

      setPaymentMethod("UPI");

    }

  }, [orderType]);



  /*

   * CURRENT CART ITEMS

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



  const isDineIn = orderType === "DINE_IN";

  const isTakeaway = orderType === "TAKEAWAY";



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



  async function handleCreateOrder() {

    setError("");



    if (!customerName.trim()) {

      setError("Customer name is required.");

      return;

    }



    if (isDineIn && !tableNumber.trim() && !qrToken) {

      setError(

        "Table number is required for Dine-In."

      );

      return;

    }



    if (!isValidIndianPhone(phone.trim())) {

      setError(

        "Please enter a valid 10-digit Indian mobile number."

      );

      return;

    }



    if (cartItems.length === 0) {

      setError("Your cart is empty.");

      return;

    }



    if (

      isTakeaway &&

      paymentMethod !== "UPI"

    ) {

      setError(

        "Takeaway orders support UPI payment only."

      );

      return;

    }



    setCreatingOrder(true);



    try {

      /*

       * STEP 1

       * Create restaurant order.

       *

       * The server calculates the final price.

       */

      const orderResponse = await fetch(

        "/api/orders",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            customerName: customerName.trim(),

            customerPhone: phone.trim(),

            notes: notes.trim(),

            qrToken: qrToken || undefined,

            type: orderType,

            tableNumber: isDineIn

              ? tableNumber.trim()

              : undefined,

            paymentMethod,

            items: cartItems.map((item) => ({

              menuItemId: item.id,

              quantity: item.quantity,

            })),

          }),

        }

      );



      let orderData: {

        success?: boolean;

        orderId?: string;

        orderNumber?: string;

        total?: number;

        paymentStatus?: string;

        orderStatus?: string;

        error?: string;

      };



      try {

        orderData = await orderResponse.json();

      } catch {

        throw new Error(

          "The server returned an invalid response."

        );

      }



      if (!orderResponse.ok) {

        throw new Error(

          orderData.error ||

            "Failed to create restaurant order."

        );

      }



      if (

        !orderData.orderId ||

        !orderData.orderNumber

      ) {

        throw new Error(

          "Restaurant order was created without an Order ID."

        );

      }



      /*

       * CASH AT COUNTER

       */

      if (paymentMethod === "CASH") {

        localStorage.removeItem(CART_KEY);



        const params = new URLSearchParams();



        params.set(

          "orderId",

          orderData.orderId

        );



        params.set(

          "orderNumber",

          orderData.orderNumber

        );



        params.set(

          "name",

          customerName.trim()

        );



        params.set("type", "dine-in");



        params.set("payment", "CASH");



        params.set(

          "paymentStatus",

          orderData.paymentStatus ||

            "PENDING"

        );



        params.set(

          "orderStatus",

          orderData.orderStatus ||

            "PENDING"

        );



        params.set(

          "total",

          String(

            orderData.total ?? subtotal

          )

        );



        if (tableNumber.trim()) {

          params.set(

            "table",

            tableNumber.trim()

          );

        }

        if (qrToken) params.set("qrToken", qrToken);

        router.push(

          `/order-confirmation?${params.toString()}`

        );



        return;

      }



      /*

       * UPI

       *

       * Create Cashfree payment session.

       */

      const paymentResponse = await fetch(

        "/api/payments/cashfree",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            orderId: orderData.orderId,

          }),

        }

      );



      const paymentData: {

        success?: boolean;

        paymentSessionId?: string;

        error?: string;

      } = await paymentResponse.json();



      if (!paymentResponse.ok) {

        throw new Error(

          paymentData.error ||

            "Failed to create Cashfree payment."

        );

      }



      if (!paymentData.paymentSessionId) {

        throw new Error(

          "Cashfree payment session was not created."

        );

      }



      /*

       * Load Cashfree Sandbox.

       */

      const cashfree = await load({

        mode: "sandbox",

      });



      if (!cashfree) {

        throw new Error(

          "Unable to load Cashfree checkout."

        );

      }



      /*

       * Restaurant order already exists.

       * It is now safe to clear local cart.

       */

      localStorage.removeItem(CART_KEY);



      /*

       * Open Cashfree checkout.

       */

      await cashfree.checkout({

        paymentSessionId:

          paymentData.paymentSessionId,

        redirectTarget: "_self",

      });

    } catch (error) {

      console.error(

        "Checkout failed:",

        error

      );



      setError(

        error instanceof Error

          ? error.message

          : "Something went wrong while placing your order."

      );

    } finally {

      setCreatingOrder(false);

    }

  }



  if (!cartLoaded || !menuLoaded) {

    return (

      <main className="min-h-screen bg-[#FFF9F3] px-4 py-8">

        <div className="mx-auto max-w-2xl">

          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

            <ShoppingBag

              size={32}

              className="mx-auto text-[#B92B27]"

            />



            <p className="mt-4 text-sm font-semibold text-[#80665B]">

              Loading checkout...

            </p>

          </div>

        </div>

      </main>

    );

  }



  return (

    <main className="min-h-screen bg-[#FFF9F3] pb-28 text-[#2D1713]">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-[#EBD9CC] bg-[#FFF9F3]/95 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4">

          <button

            type="button"

            onClick={() => router.back()}

            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E5D3C5]"

          >

            <ArrowLeft size={19} />

          </button>



          <div>

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B92B27]">

              VEERJI'S KULCHA

            </p>



            <h1 className="text-xl font-black">

              Checkout

            </h1>

          </div>

        </div>

      </header>



      <div className="mx-auto max-w-3xl px-4 py-5">

        {/* CUSTOMER */}

        <section className="rounded-2xl border border-[#EBD9CC] bg-white p-5 shadow-sm">

          <p className="text-xs font-bold uppercase tracking-wider text-[#9A8074]">

            Customer

          </p>



          <h2 className="mt-1 text-xl font-black">

            {customerName}

          </h2>



          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

            <div className="rounded-xl bg-[#FFF9F3] p-3">

              <p className="text-[10px] font-bold uppercase text-[#9A8074]">

                Order Type

              </p>



              <p className="mt-1 font-black">

                {isDineIn

                  ? "Dine-In"

                  : "Takeaway"}

              </p>

            </div>



            {isDineIn && (

              <div className="rounded-xl bg-[#FFF9F3] p-3">

                <p className="text-[10px] font-bold uppercase text-[#9A8074]">

                  Table

                </p>



                <p className="mt-1 font-black">

                  {tableNumber || "Not provided"}

                </p>

              </div>

            )}

          </div>

<div className="mt-4">

  <label className="text-xs font-bold text-[#80665B]">

    Your Name *

  </label>



  <input

    type="text"

    autoComplete="name"

    maxLength={100}

    required

    value={customerName}

    onChange={(event) => {

      setCustomerName(event.target.value);

      setError("");

    }}

    placeholder="Enter your name"

    className="mt-2 w-full rounded-xl border border-[#E2CEC0] bg-white px-4 py-3 text-sm outline-none focus:border-[#B92B27] focus:ring-2 focus:ring-[#B92B27]/10"

  />

</div>

          {/* PHONE */}

          <div className="mt-4">

            <label className="text-xs font-bold text-[#80665B]">

              Mobile Number

            </label>



            <input

              type="tel"

              inputMode="numeric"

              maxLength={10}

              value={phone}

              onChange={(event) => {

                setPhone(

                  event.target.value.replace(

                    /\D/g,

                    ""

                  )

                );



                setError("");

              }}

              placeholder="Enter 10-digit mobile number"

              className="mt-2 w-full rounded-xl border border-[#E2CEC0] bg-white px-4 py-3 text-sm outline-none focus:border-[#B92B27] focus:ring-2 focus:ring-[#B92B27]/10"

            />

          </div>

        </section>



        {/* ORDER */}

        <section className="mt-4 rounded-2xl border border-[#EBD9CC] bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <h2 className="text-lg font-black">

              Your Order

            </h2>



            <span className="rounded-full bg-[#FFF0E9] px-3 py-1 text-xs font-black text-[#B92B27]">

              {totalItems}{" "}

              {totalItems === 1

                ? "Item"

                : "Items"}

            </span>

          </div>



          {cartItems.length === 0 ? (

            <div className="mt-5 rounded-xl border border-dashed border-[#E2CEC0] p-6 text-center">

              <p className="font-bold">

                Your cart is empty

              </p>



              <button

                type="button"

                onClick={() => router.back()}

                className="mt-3 text-sm font-black text-[#B92B27]"

              >

                Back to Menu

              </button>

            </div>

          ) : (

            <div className="mt-4 divide-y divide-[#F0E3DA]">

              {cartItems.map((item) => (

                <div

                  key={item.id}

                  className="flex gap-3 py-4"

                >

                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F3E3D8]">

                    {item.imageUrl ? (

                      <img

                        src={item.imageUrl}

                        alt={item.name}

                        className="h-full w-full object-cover"

                      />

                    ) : (

                      <div className="flex h-full items-center justify-center text-xl">

                        🍽️

                      </div>

                    )}

                  </div>



                  <div className="min-w-0 flex-1">

                    <p className="font-black">

                      {item.name}

                    </p>



                    <p className="mt-1 text-xs text-[#9A8074]">

                      ₹{Number(item.price || 0)} ×{" "}

                      {item.quantity}

                    </p>



                    <div className="mt-2 flex h-8 w-fit items-center overflow-hidden rounded-lg border border-[#E2CEC0]">

                      <button

                        type="button"

                        onClick={() =>

                          updateQuantity(

                            item.id,

                            item.quantity - 1

                          )

                        }

                        className="flex h-8 w-8 items-center justify-center text-[#B92B27]"

                      >

                        <Minus size={13} />

                      </button>



                      <span className="min-w-7 text-center text-xs font-black">

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

                        className="flex h-8 w-8 items-center justify-center bg-[#B92B27] text-white"

                      >

                        <Plus size={13} />

                      </button>

                    </div>

                  </div>



                  <p className="font-black">

                    ₹{item.total}

                  </p>

                </div>

              ))}

            </div>

          )}



          {cartItems.length > 0 && (

            <div className="mt-3 border-t border-[#F0E3DA] pt-4">

              <div className="flex justify-between text-sm text-[#80665B]">

                <span>Subtotal</span>

                <span>₹{subtotal}</span>

              </div>



              <div className="mt-3 flex justify-between text-lg font-black">

                <span>Total</span>

                <span className="text-[#B92B27]">

                  ₹{subtotal}

                </span>

              </div>

            </div>

          )}

        </section>

<section className="mt-4 rounded-2xl border border-[#EBD9CC] bg-white p-5 shadow-sm">

  <div className="flex items-center justify-between gap-3">

    <h2 className="text-lg font-black">

      Special Instructions

    </h2>



    <span className="rounded-full bg-[#F5EEE8] px-3 py-1 text-xs font-bold text-[#80665B]">

      Optional

    </span>

  </div>



  <p className="mt-2 text-sm leading-6 text-[#80665B]">

    Any preferences for your order? Let us know about

    less spice, extra butter, or other preparation requests.

  </p>



  <textarea

    value={notes}

    onChange={(event) =>

      setNotes(event.target.value.slice(0, 300))

    }

    maxLength={300}

    rows={3}

    placeholder="E.g. less spicy, extra butter..."

    className="mt-3 w-full resize-y rounded-xl border border-[#E2CEC0] bg-white px-4 py-3 text-sm outline-none focus:border-[#B92B27] focus:ring-2 focus:ring-[#B92B27]/10"

  />



  <p className="mt-1 text-right text-xs text-[#9A8074]">

    {notes.length}/300

  </p>

</section>

        {/* PAYMENT */}

        <section className="mt-4 rounded-2xl border border-[#EBD9CC] bg-white p-5 shadow-sm">

          <h2 className="text-lg font-black">

            Payment Method

          </h2>



          {/* UPI */}

          <button

            type="button"

            onClick={() =>

              setPaymentMethod("UPI")

            }

            className={`mt-4 flex w-full items-center justify-between rounded-2xl border p-4 text-left ${

              paymentMethod === "UPI"

                ? "border-[#B92B27] bg-[#FFF5F0]"

                : "border-[#E2CEC0]"

            }`}

          >

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF0E9] text-[#B92B27]">

                <CreditCard size={19} />

              </div>



              <div>

                <p className="font-black">

                  UPI

                </p>



                <p className="mt-1 text-xs text-[#80665B]">

                  Pay securely with Cashfree

                </p>

              </div>

            </div>



            {paymentMethod === "UPI" && (

              <Check

                size={20}

                className="text-[#B92B27]"

              />

            )}

          </button>



          {/* CASH */}

          {isDineIn && (

            <button

              type="button"

              onClick={() =>

                setPaymentMethod("CASH")

              }

              className={`mt-3 flex w-full items-center justify-between rounded-2xl border p-4 text-left ${

                paymentMethod === "CASH"

                  ? "border-[#B92B27] bg-[#FFF5F0]"

                  : "border-[#E2CEC0]"

              }`}

            >

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF0E9] text-[#B92B27]">

                  <Wallet size={19} />

                </div>



                <div>

                  <p className="font-black">

                    Cash at Counter

                  </p>



                  <p className="mt-1 text-xs text-[#80665B]">

                    Pay ₹{subtotal} at the counter

                  </p>

                </div>

              </div>



              {paymentMethod === "CASH" && (

                <Check

                  size={20}

                  className="text-[#B92B27]"

                />

              )}

            </button>

          )}



          {paymentMethod === "CASH" && (

            <div className="mt-4 rounded-xl bg-[#FFF7DD] p-4">

              <p className="text-sm font-black text-[#765400]">

                Cash at Counter

              </p>



              <p className="mt-1 text-xs leading-5 text-[#806A35]">

                Your order will remain Payment Pending

                until the Counter Operator receives your

                cash.

              </p>

            </div>

          )}

        </section>



        {/* ERROR */}

        {error && (

          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">

            {error}

          </div>

        )}



        {/* PLACE ORDER */}

        <button

          type="button"

          disabled={

            creatingOrder ||

            cartItems.length === 0

          }

          onClick={handleCreateOrder}

          className="mt-5 w-full rounded-2xl bg-[#B92B27] px-5 py-4 text-base font-black text-white shadow-xl shadow-red-900/10 disabled:cursor-not-allowed disabled:bg-[#CFC4BE]"

        >

          {creatingOrder

            ? paymentMethod === "UPI"

              ? "Opening Secure Payment..."

              : "Placing Order..."

            : paymentMethod === "UPI"

              ? `Pay ₹${subtotal} with UPI`

              : `Place Order · ₹${subtotal}`}

        </button>



        <p className="mt-3 text-center text-[11px] leading-5 text-[#9A8074]">

          {paymentMethod === "UPI"

            ? "Payment is securely processed through Cashfree."

            : "Cash payment will be confirmed by the counter operator."}

        </p>

      </div>

    </main>

  );

}