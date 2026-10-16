"use client";

import { useEffect, useMemo, useState } from "react";

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

type Category = {
  id: string;
  name: string;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  categoryId: string;
  isAvailable: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  categoryId: "",
  isAvailable: true,
};

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadMenu() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/menu", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load menu.");
      }

      setItems(data.items || []);
      setCategories(data.categories || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load menu."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const categoryMatch =
        selectedCategory === "ALL" ||
        item.categoryId === selectedCategory;

      const searchMatch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query);

      return categoryMatch && searchMatch;
    });
  }, [items, selectedCategory, search]);

  function openAddModal() {
    setEditingItem(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id || "",
    });
    setMessage("");
    setError("");
    setShowModal(true);
  }

  function openEditModal(item: MenuItem) {
    setEditingItem(item);

    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price === null ? "" : String(item.price),
      imageUrl: item.imageUrl || "",
      categoryId: item.categoryId,
      isAvailable: item.isAvailable,
    });

    setMessage("");
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingItem(null);
    setForm(emptyForm);
  }

  async function saveItem() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const price =
        form.price.trim() === "" ? null : Number(form.price);

      if (
        price !== null &&
        (!Number.isFinite(price) || price < 0)
      ) {
        throw new Error("Enter a valid price.");
      }

      if (!form.name.trim()) {
        throw new Error("Item name is required.");
      }

      if (!form.categoryId) {
        throw new Error("Please select a category.");
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        imageUrl: form.imageUrl.trim() || null,
        categoryId: form.categoryId,
        isAvailable: form.isAvailable,
      };

      const url = editingItem
        ? `/api/admin/menu/${editingItem.id}`
        : "/api/admin/menu";

      const response = await fetch(url, {
        method: editingItem ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save menu item.");
      }

      setMessage(
        editingItem
          ? "Menu item updated successfully."
          : "Menu item added successfully."
      );

      await loadMenu();

      setTimeout(() => {
        setShowModal(false);
        setEditingItem(null);
        setForm(emptyForm);
        setMessage("");
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save menu item."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(item: MenuItem) {
    try {
      setError("");

      const response = await fetch(
        `/api/admin/menu/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isAvailable: !item.isAvailable,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update availability."
        );
      }

      await loadMenu();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update availability."
      );
    }
  }

  async function deleteItem(item: MenuItem) {
    if (!window.confirm(`Delete "${item.name}" from the menu?`)) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `/api/admin/menu/${item.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete item.");
      }

      await loadMenu();

      setMessage(`${item.name} deleted successfully.`);

      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete item."
      );
    }
  }

  const availableCount = items.filter(
    (item) => item.isAvailable
  ).length;

  const unavailableCount = items.length - availableCount;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-orange-600">
              VeerJi&apos;s Kulcha
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              Menu Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage dishes, prices and availability.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            + Add Menu Item
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Items</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {items.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Available</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {availableCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Unavailable</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {unavailableCount}
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                selectedCategory === "ALL"
                  ? "bg-orange-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                  selectedCategory === category.id
                    ? "bg-orange-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Loading menu...
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Item</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Availability</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xl">🍽️</span>
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.name}
                            </p>

                            <p className="mt-1 max-w-sm text-xs text-slate-500">
                              {item.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {item.categoryName}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {item.price === null
                          ? "₹TBD"
                          : `₹${item.price}`}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleAvailability(item)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.isAvailable
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.isAvailable
                            ? "Available"
                            : "Unavailable"}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteItem(item)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {editingItem
                        ? "Edit Menu Item"
                        : "Add Menu Item"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Keep your menu information up to date.
                    </p>
                  </div>

                  <button
                    onClick={closeModal}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Item Name
                  </label>

                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Amritsari Kulcha"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Short description..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          price: e.target.value,
                        })
                      }
                      placeholder="100"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Category
                    </label>

                    <select
                      value={form.categoryId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          categoryId: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="">
                        Select category
                      </option>

                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Image URL
                  </label>

                  <input
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        imageUrl: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isAvailable: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Available for customers
                    </p>

                    <p className="text-xs text-slate-500">
                      Customers can order this item when enabled.
                    </p>
                  </div>
                </label>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {message}
                  </div>
                )}
              </div>

              <div className="flex gap-3 border-t border-slate-200 p-6">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={saveItem}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingItem
                      ? "Save Changes"
                      : "Add Item"}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}
