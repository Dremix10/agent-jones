import { Suspense } from "react";
import OwnerPageClient from "./OwnerPageClient";

export default function OwnerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-zinc-500">
          Loading owner dashboard…
        </div>
      }
    >
      <OwnerPageClient />
    </Suspense>
  );
}
