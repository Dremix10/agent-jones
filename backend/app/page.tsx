"use client";

import Link from "next/link";
import { Card, Header } from "@/components/ui";
import { USE_MOCK } from "@/components/config";

export default function HomePage() {
  return (
    <div className="relative">
      <Header title="AI Front Desk" showThemeToggle />
      {USE_MOCK && (
        <div className="fixed top-4 right-4 z-50 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-medium border border-amber-300 dark:border-amber-700">
          MOCK MODE
        </div>
      )}
      <main className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        <Card className="max-w-lg w-full p-8 space-y-6">
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
              AI Front Desk — Judge Mode
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
              Run the customer flow or review the dashboard
            </p>
          </div>
          
          <div className="flex flex-col gap-4 pt-4">
            <Link
              href="/demo"
              className="w-full px-6 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 text-center"
            >
              Start Customer Flow →
            </Link>
            <Link
              href="/owner"
              className="w-full px-6 py-4 text-base font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 text-center"
            >
              Open Owner Dashboard →
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
