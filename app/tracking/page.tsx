import { Suspense } from "react";
import TrackingClient from "./TrackingClient";

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading order tracking...
        </div>
      }
    >
      <TrackingClient />
    </Suspense>
  );
}
