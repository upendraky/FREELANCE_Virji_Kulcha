"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OrderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = searchParams.get("type");

    if (type !== "dine-in" && type !== "takeaway") {
      router.replace("/");
      return;
    }

    // Preserve the table or QR information supplied by the QR URL.
    const params = new URLSearchParams(searchParams.toString());

    // Customer details will now be collected at checkout.
    params.delete("name");
    params.delete("phone");
    params.delete("notes");

    router.replace(`/menu?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF9F3] px-5">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0E9] text-2xl">
          🍽️
        </div>
        <h1 className="mt-4 text-xl font-black text-[#2D1713]">
          VeerJi&apos;s Kulcha
        </h1>
        <p className="mt-2 text-sm text-[#80665B]">
          Preparing your menu...
        </p>
      </div>
    </main>
  );
}