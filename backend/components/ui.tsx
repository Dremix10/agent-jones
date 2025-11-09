"use client";

import React from "react";
import Link from "next/link";

function cx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

/* === THEME TOGGLE LOGIC (client-only) === */
function applyTheme(next: "light" | "dark") {
  const root = document.documentElement; // <html>
  if (next === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  try { localStorage.setItem("theme", next); } catch {}
}

function getInitialTheme(): "light" | "dark" {
  // 1) user pref in localStorage
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {}
  // 2) system preference
  if (typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    // ensure DOM reflects initial preference
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="rounded-2xl px-3 py-1.5 text-sm shadow border
                 bg-white/70 hover:bg-white dark:bg-neutral-800/70 dark:hover:bg-neutral-800
                 border-neutral-200 dark:border-neutral-700"
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

/* === YOUR EXISTING UI PRIMITIVES (keep yours; showing minimal versions) === */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "rounded-2xl shadow p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cx("text-xl font-semibold mb-2", className)} {...props} />;
}

export function BigStat({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("text-4xl font-extrabold", className)} {...props} />;
}

export function PrimaryButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        "rounded-2xl shadow px-4 py-2 font-medium",
        "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
        "dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700",
        className
      )}
      {...props}
    />
  );
}

/* === Header that uses ThemeToggle === */
export function Header({ title, showThemeToggle = true }: { title?: string; showThemeToggle?: boolean }) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    // Ensure the page respects saved preference or system setting on mount
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{title ?? ""}</h1>

      <div className="flex items-center gap-3">
        {showThemeToggle ? (
          <button
            onClick={toggle}
            className="rounded-2xl px-3 py-1.5 text-sm shadow border
                       bg-white/70 hover:bg-white dark:bg-neutral-800/70 dark:hover:bg-neutral-800
                       border-neutral-200 dark:border-neutral-700"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
        ) : null}
      </div>
    </div>
  );
}


export function SiteHeader() {
  const toggleDarkMode = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark');
    }
  };

  return (
    <header className="sticky top-0 backdrop-blur border-b px-4 py-2 flex justify-between items-center bg-white/80 z-50">
      <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
        Agent Jones
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/demo" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
          Demo
        </Link>
        <Link href="/owner" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
          Owner
        </Link>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle dark mode"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>
    </header>
  );
}

interface ModeBannerProps {
  mode: "MOCK" | "LIVE";
}

export function ModeBanner({ mode }: ModeBannerProps) {
  const isMock = mode === "MOCK";

  return (
    <div className="mt-4">
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
        isMock
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
          : 'bg-green-100 text-green-800 border border-green-300'
      }`}>
        {mode} MODE
      </span>
    </div>
  );
}
