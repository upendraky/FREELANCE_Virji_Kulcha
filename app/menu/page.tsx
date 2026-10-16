import { Suspense } from "react";
import MenuClient from "./MenuClient";

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading menu...
        </div>
      }
    >
      <MenuClient />
    </Suspense>
  );
}
