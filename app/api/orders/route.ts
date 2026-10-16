import { NextResponse } from "next/server";
import { z } from "zod";
import { Temporal } from "@js-temporal/polyfill";
import { db } from "@/lib/db";

// Prisma 8 runtime requires Temporal to be available globally.
(globalThis as typeof globalThis & { Temporal: typeof Temporal }).Temporal = Temporal;

const RESTAURANT_ID = "restaurant-veerjis-kulcha";

const orderSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required.").max(100, "Customer name is too long."),
  customerPhone: z.string().regex(/^[6-9][0-9]{9}$/, "Invalid 10-digit Indian mobile number."),
  type: z.enum(["DINE_IN", "TAKEAWAY"]),
  tableNumber: z.string().trim().optional(),
  qrToken: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(500, "Special instructions must be 500 characters or fewer.").optional().default(""),
  paymentMethod: z.enum(["UPI", "CASH"]),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().int().min(1).max(50),
  })).min(1, "Cart cannot be empty."),
});

async function generateOrderNumber(): Promise<string> {
  const existingOrders = await db.orm.public.Order.all();
  const existingNumbers = new Set(existingOrders.map((order) => order.orderNumber));

  // Generate a short, human-readable number and check it against existing orders.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    const candidate = `VK${suffix}`;
    if (!existingNumbers.has(candidate)) return candidate;
  }

  // Extremely unlikely fallback; still unique enough for this order flow.
  return `VK${Date.now().toString().slice(-8)}`;
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
    }

    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid order data.",
        details: parsed.error.issues,
      }, { status: 400 });
    }

    const input = parsed.data;

    if (input.type === "TAKEAWAY" && input.paymentMethod !== "UPI") {
      return NextResponse.json({ success: false, error: "Takeaway orders require UPI payment." }, { status: 400 });
    }

    if (input.type === "DINE_IN" && !input.qrToken && !input.tableNumber) {
      return NextResponse.json({ success: false, error: "Scan a table QR code or provide a table number for dine-in." }, { status: 400 });
    }

    let tableId: string | null = null;
    let resolvedTableNumber: string | null = null;

    if (input.type === "DINE_IN") {
      const tables = await db.orm.public.RestaurantTable.all();
      const table = input.qrToken
        ? tables.find((item) => item.restaurantId === RESTAURANT_ID && item.qrToken === input.qrToken)
        : tables.find((item) => item.restaurantId === RESTAURANT_ID && item.number === input.tableNumber);

      if (!table) {
        return NextResponse.json({
          success: false,
          error: input.qrToken ? "This table QR code is invalid. Please scan the QR code again or ask staff for help." : "Invalid table number.",
        }, { status: 400 });
      }

      tableId = table.id;
      resolvedTableNumber = table.number;
    }

    const menuItems = await db.orm.public.MenuItem.all();
    const selectedItems: Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }> = [];

    for (const cartItem of input.items) {
      const menuItem = menuItems.find((item) => item.id === cartItem.menuItemId);
      if (!menuItem) {
        return NextResponse.json({ success: false, error: "One of the selected menu items no longer exists." }, { status: 400 });
      }
      if (!menuItem.isAvailable) {
        return NextResponse.json({ success: false, error: `${menuItem.name} is currently unavailable.` }, { status: 400 });
      }
      if (menuItem.price === null || menuItem.price === undefined) {
        return NextResponse.json({ success: false, error: `${menuItem.name} does not have a price.` }, { status: 400 });
      }

      const unitPrice = Number(menuItem.price);
      const lineTotal = unitPrice * cartItem.quantity;
      if (!Number.isFinite(lineTotal) || lineTotal < 0) {
        return NextResponse.json({ success: false, error: `Invalid price for ${menuItem.name}.` }, { status: 400 });
      }
      selectedItems.push({ menuItemId: menuItem.id, name: menuItem.name, quantity: cartItem.quantity, unitPrice, total: lineTotal });
    }

    const total = selectedItems.reduce((sum, item) => sum + item.total, 0);
    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ success: false, error: "Invalid order total." }, { status: 400 });
    }

    const orderId = crypto.randomUUID();
    const paymentId = crypto.randomUUID();
    const orderNumber = await generateOrderNumber();
    const now = Temporal.Now.instant();

    // These writes follow the existing Prisma 8 contract runtime style.
    // If any write fails, the catch returns an error; transaction support can be added separately.
    await db.orm.public.Order.create({
      id: orderId,
      orderNumber,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      notes: input.notes || null,
      type: input.type,
      status: "PENDING",
      tableId,
      restaurantId: RESTAURANT_ID,
      acceptedById: null,
      total: total.toFixed(2),
      createdAt: now,
      updatedAt: now,
    });

    for (const item of selectedItems) {
      await db.orm.public.OrderItem.create({
        id: crypto.randomUUID(),
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        total: item.total.toFixed(2),
        createdAt: now,
      });
    }

    await db.orm.public.Payment.create({
      id: paymentId,
      method: input.paymentMethod,
      status: "PENDING",
      amount: total.toFixed(2),
      transactionId: null,
      orderId,
      confirmedById: null,
      paidAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      total,
      tableNumber: resolvedTableNumber,
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create restaurant order:", error);
    return NextResponse.json({ success: false, error: "Unable to create your order right now. Please try again." }, { status: 500 });
  }
}
