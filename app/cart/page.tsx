import { Suspense } from "react";
import CartClient from "./CartClient";

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading cart...
        </div>
      }
    >
      <CartClient />
    </Suspense>
  );
}
