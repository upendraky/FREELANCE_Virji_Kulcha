import { Suspense } from "react";
import OrderClient from "./OrderClient";

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading order...
        </div>
      }
    >
      <OrderClient />
    </Suspense>
  );
}
