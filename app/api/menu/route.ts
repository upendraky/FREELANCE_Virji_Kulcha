import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const RESTAURANT_ID = "restaurant-veerjis-kulcha";

export async function GET() {
  try {
    const [menuItems, categories] = await Promise.all([
      db.orm.public.MenuItem.all(),
      db.orm.public.Category.all(),
    ]);

    const restaurantCategories = categories
      .filter(
        (category) => category.restaurantId === RESTAURANT_ID
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    const availableItems = menuItems
      .filter(
        (item) =>
          item.restaurantId === RESTAURANT_ID &&
          item.isAvailable &&
          item.price !== null
      )
      .map((item) => {
        const category = restaurantCategories.find(
          (category) => category.id === item.categoryId
        );

return {
  id: item.id,
  name: item.name,
  description: item.description,
  price: Number(item.price),
  imageUrl: item.imageUrl,
  isAvailable: item.isAvailable,
  categoryId: item.categoryId,
categoryName:
  category?.name === "Breads"
    ? "Naan"
    : category?.name ?? "Other",
};
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      items: availableItems,
      categories: restaurantCategories.map((category) => ({
        id: category.id,
        name: category.name,
      })),
    });
  } catch (error) {
    console.error("Customer menu GET failed:", error);

    return NextResponse.json(
      {
        error: "Failed to load menu.",
      },
      { status: 500 }
    );
  }
}
