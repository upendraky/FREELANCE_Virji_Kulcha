"use client";

import { useEffect, useMemo, useState } from "react";

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  threshold: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  updatedAt: string;
};

type InventoryHistory = {
  id: string;
  inventoryItemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  type: "ADD" | "REMOVE" | "ADJUST";
  reference: string | null;
  createdAt: string;
};

type AdjustmentType = "ADD" | "REMOVE" | "ADJUST";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [history, setHistory] = useState<InventoryHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Add inventory modal
  const [showAddForm, setShowAddForm] = useState(false);

  // Add inventory fields
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [quantity, setQuantity] = useState("");
  const [threshold, setThreshold] = useState("");
  const [adding, setAdding] = useState(false);

  // Adjustment modal
  const [selectedItem, setSelectedItem] =
    useState<InventoryItem | null>(null);

  const [adjustType, setAdjustType] =
    useState<AdjustmentType>("ADD");

  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReference, setAdjustReference] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  async function loadInventory() {
    try {
      const response = await fetch("/api/admin/inventory", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.success) {
        setInventory(data.inventory);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Inventory load failed:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      setHistoryLoading(true);

      const response = await fetch(
        "/api/admin/inventory/history",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Inventory history load failed:", error);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
    loadHistory();
  }, []);

  async function addInventoryItem() {
    if (!name.trim() || !quantity || !threshold) {
      alert("Please fill all required fields.");
      return;
    }

    const numericQuantity = Number(quantity);
    const numericThreshold = Number(threshold);

    if (
      !Number.isFinite(numericQuantity) ||
      !Number.isFinite(numericThreshold) ||
      numericQuantity < 0 ||
      numericThreshold < 0
    ) {
      alert("Please enter valid quantities.");
      return;
    }

    setAdding(true);

    try {
      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          unit,
          quantity: numericQuantity,
          threshold: numericThreshold,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to add inventory item.");
        return;
      }

      setName("");
      setUnit("kg");
      setQuantity("");
      setThreshold("");
      setShowAddForm(false);

      await loadInventory();
      await loadHistory();
    } catch (error) {
      console.error("Inventory creation failed:", error);
      alert("Something went wrong.");
    } finally {
      setAdding(false);
    }
  }

  async function adjustStock() {
    if (!selectedItem || !adjustQuantity) {
      alert("Please enter a quantity.");
      return;
    }

    const numericQuantity = Number(adjustQuantity);

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      alert("Enter a valid quantity greater than 0.");
      return;
    }

    if (
      adjustType === "REMOVE" &&
      numericQuantity > selectedItem.quantity
    ) {
      alert(
        `You cannot remove more than ${selectedItem.quantity} ${selectedItem.unit}.`
      );
      return;
    }

    setAdjusting(true);

    try {
      const response = await fetch(
        `/api/admin/inventory/${selectedItem.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantityChange: numericQuantity,
            type: adjustType,
            reference:
              adjustReference.trim() ||
              "Manual inventory adjustment",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to adjust stock.");
        return;
      }

      setSelectedItem(null);
      setAdjustQuantity("");
      setAdjustReference("");
      setAdjustType("ADD");

      await loadInventory();
      await loadHistory();
    } catch (error) {
      console.error("Stock adjustment failed:", error);
      alert("Something went wrong while adjusting stock.");
    } finally {
      setAdjusting(false);
    }
  }

  const stats = useMemo(() => {
    const lowStock = inventory.filter(
      (item) => item.stockStatus === "LOW_STOCK"
    ).length;

    const outOfStock = inventory.filter(
      (item) => item.stockStatus === "OUT_OF_STOCK"
    ).length;

    const healthy = inventory.filter(
      (item) => item.stockStatus === "IN_STOCK"
    ).length;

    return {
      total: inventory.length,
      healthy,
      lowStock,
      outOfStock,
    };
  }, [inventory]);

  function statusLabel(
    status: InventoryItem["stockStatus"]
  ) {
    if (status === "LOW_STOCK") {
      return "Low Stock";
    }

    if (status === "OUT_OF_STOCK") {
      return "Out of Stock";
    }

    return "In Stock";
  }

  function statusClass(
    status: InventoryItem["stockStatus"]
  ) {
    if (status === "LOW_STOCK") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "OUT_OF_STOCK") {
      return "bg-red-100 text-red-700";
    }

    return "bg-green-100 text-green-700";
  }

  function historyTypeClass(
    type: InventoryHistory["type"]
  ) {
    if (type === "ADD") {
      return "bg-green-100 text-green-700";
    }

    if (type === "REMOVE") {
      return "bg-red-100 text-red-700";
    }

    return "bg-blue-100 text-blue-700";
  }

  function openAdjustment(item: InventoryItem) {
    setSelectedItem(item);
    setAdjustType("ADD");
    setAdjustQuantity("");
    setAdjustReference("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-orange-600">
              VeerJi&apos;s Kulcha
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Inventory
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor ingredients and manage restaurant stock.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            + Add Inventory
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Items
            </p>

            <p className="mt-2 text-3xl font-bold">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Healthy Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {stats.healthy}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Low Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {stats.lowStock}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Out of Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {stats.outOfStock}
            </p>
          </div>
        </div>

        {/* Inventory Alerts */}
        {(stats.lowStock > 0 || stats.outOfStock > 0) && (
          <div className="mb-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <div className="flex items-start gap-3">
              <div className="text-xl">
                ⚠️
              </div>

              <div>
                <h2 className="font-semibold text-yellow-900">
                  Inventory Alerts
                </h2>

                <div className="mt-3 space-y-2 text-sm text-yellow-800">
                  {inventory
                    .filter(
                      (item) =>
                        item.stockStatus === "LOW_STOCK" ||
                        item.stockStatus === "OUT_OF_STOCK"
                    )
                    .map((item) => (
                      <p key={item.id}>
                        <strong>{item.name}</strong>{" "}
                        {item.stockStatus === "OUT_OF_STOCK"
                          ? "is out of stock."
                          : `is running low (${item.quantity} ${item.unit} remaining).`}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">
                Current Inventory
              </h2>

              <p className="text-sm text-slate-500">
                Live restaurant stock
              </p>
            </div>

            <button
              onClick={loadInventory}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading inventory...
            </div>
          ) : inventory.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No inventory items found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Ingredient
                    </th>

                    <th className="px-5 py-4">
                      Current Stock
                    </th>

                    <th className="px-5 py-4">
                      Minimum Stock
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Last Updated
                    </th>

                    <th className="px-5 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {inventory.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {item.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          Unit: {item.unit}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {item.quantity} {item.unit}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.threshold} {item.unit}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            item.stockStatus
                          )}`}
                        >
                          {statusLabel(item.stockStatus)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(
                          item.updatedAt
                        ).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() =>
                            openAdjustment(item)
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-100"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </section>

        {/* Inventory History */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">
                Inventory History
              </h2>

              <p className="text-sm text-slate-500">
                Recent stock additions, removals and adjustments
              </p>
            </div>

            <button
              onClick={loadHistory}
              disabled={historyLoading}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {historyLoading
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>
          </div>

          {historyLoading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading inventory history...
            </div>
          ) : history.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No inventory transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Ingredient
                    </th>

                    <th className="px-5 py-4">
                      Change
                    </th>

                    <th className="px-5 py-4">
                      Type
                    </th>

                    <th className="px-5 py-4">
                      Reference
                    </th>

                    <th className="px-5 py-4">
                      Date & Time
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {history.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {transaction.itemName}
                        </p>

                        <p className="text-xs text-slate-500">
                          Unit: {transaction.unit}
                        </p>
                      </td>

                      <td
                        className={`px-5 py-4 font-semibold ${
                          transaction.quantity > 0
                            ? "text-green-600"
                            : transaction.quantity < 0
                              ? "text-red-600"
                              : "text-blue-600"
                        }`}
                      >
                        {transaction.quantity > 0
                          ? "+"
                          : ""}
                        {transaction.quantity}{" "}
                        {transaction.unit}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${historyTypeClass(
                            transaction.type
                          )}`}
                        >
                          {transaction.type}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {transaction.reference || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(
                          transaction.createdAt
                        ).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </section>
      </div>

      {/* Add Inventory Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Add Inventory Item
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a new restaurant ingredient.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddForm(false)
                }
                className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Ingredient Name
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="e.g. Tomatoes"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Unit
                </label>

                <select
                  value={unit}
                  onChange={(e) =>
                    setUnit(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                >
                  <option value="kg">
                    kg
                  </option>

                  <option value="litres">
                    litres
                  </option>

                  <option value="packets">
                    packets
                  </option>

                  <option value="pieces">
                    pieces
                  </option>

                  <option value="boxes">
                    boxes
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(e.target.value)
                    }
                    placeholder="25"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Minimum Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={threshold}
                    onChange={(e) =>
                      setThreshold(e.target.value)
                    }
                    placeholder="5"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                  />
                </div>

              </div>

              <button
                onClick={addInventoryItem}
                disabled={adding}
                className="w-full rounded-xl bg-orange-600 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding
                  ? "Adding..."
                  : "Add Inventory Item"}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Adjust Stock
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedItem.name}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedItem(null)
                }
                className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Current Stock */}
            <div className="mb-5 rounded-xl bg-slate-50 p-4">

              <p className="text-sm text-slate-500">
                Current Stock
              </p>

              <p className="mt-1 text-2xl font-bold">
                {selectedItem.quantity}{" "}
                {selectedItem.unit}
              </p>

            </div>

            <div className="space-y-4">

              {/* Adjustment Type */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Adjustment Type
                </label>

                <select
                  value={adjustType}
                  onChange={(e) =>
                    setAdjustType(
                      e.target.value as AdjustmentType
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                >
                  <option value="ADD">
                    Add Stock
                  </option>

                  <option value="REMOVE">
                    Remove Stock
                  </option>

                  <option value="ADJUST">
                    Set Exact Stock
                  </option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {adjustType === "ADJUST"
                    ? "New Stock Quantity"
                    : "Quantity"}
                </label>

                <div className="relative">

                  <input
                    type="number"
                    min="0"
                    value={adjustQuantity}
                    onChange={(e) =>
                      setAdjustQuantity(
                        e.target.value
                      )
                    }
                    placeholder="Enter quantity"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-20 outline-none focus:border-orange-500"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    {selectedItem.unit}
                  </span>

                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Reference
                </label>

                <input
                  value={adjustReference}
                  onChange={(e) =>
                    setAdjustReference(
                      e.target.value
                    )
                  }
                  placeholder="e.g. New stock purchase"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

              {/* Preview */}
              {adjustQuantity &&
                Number.isFinite(
                  Number(adjustQuantity)
                ) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        Current
                      </span>

                      <span className="font-medium">
                        {selectedItem.quantity}{" "}
                        {selectedItem.unit}
                      </span>
                    </div>

                    <div className="my-2 flex justify-between text-sm">
                      <span className="text-slate-500">
                        Change
                      </span>

                      <span className="font-medium">
                        {adjustType === "ADD"
                          ? "+"
                          : adjustType === "REMOVE"
                            ? "-"
                            : ""}
                        {adjustQuantity}{" "}
                        {selectedItem.unit}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-2">

                      <div className="flex justify-between">
                        <span className="font-semibold">
                          New Stock
                        </span>

                        <span className="font-bold">
                          {adjustType === "ADD"
                            ? selectedItem.quantity +
                              Number(adjustQuantity)
                            : adjustType === "REMOVE"
                              ? selectedItem.quantity -
                                Number(adjustQuantity)
                              : Number(
                                  adjustQuantity
                                )}{" "}
                          {selectedItem.unit}
                        </span>
                      </div>

                    </div>
                  </div>
                )}

              {/* Update */}
              <button
                onClick={adjustStock}
                disabled={adjusting}
                className="w-full rounded-xl bg-orange-600 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adjusting
                  ? "Updating..."
                  : "Update Stock"}
              </button>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}