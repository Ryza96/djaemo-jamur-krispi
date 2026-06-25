"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button
        onClick={toggle}
        aria-pressed={theme === "dark"}
        aria-label="Toggle color theme"
        className={`relative inline-flex h-8 w-14 items-center rounded-full p-1 transition-colors shadow-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-900 shadow-md transition-transform ${theme === "dark" ? "translate-x-6" : "translate-x-0"}`}
        />
        <span className="pointer-events-none absolute left-2 text-xs text-slate-500 dark:text-slate-300">☀</span>
        <span className="pointer-events-none absolute right-2 text-xs text-slate-500 dark:text-slate-300">🌙</span>
      </button>
    </div>
  );
}
