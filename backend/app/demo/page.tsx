import { Suspense } from "react";
import DemoPageClient from "./DemoPageClient";

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-zinc-500">
          Loading customer flow…
        </div>
      }
    >
      <DemoPageClient />
    </Suspense>
  );
}
