"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TabItem {
  id: string;
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  icon: React.ReactNode;
}

const iconClass = "h-6 w-6";

const TABS: TabItem[] = [
  {
    id: "beranda",
    label: "Beranda",
    href: "/",
    match: (p) => p === "/",
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M3 10.9 12 3l9 7.9" />
        <path d="M5 9.6V21h14V9.6" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    id: "produk",
    label: "Produk",
    href: "/produk",
    match: (p) => p.startsWith("/produk"),
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M6 6h3v3H6zM10.5 6h3v3h-3zM15 6h3v3h-3z" />
        <path d="M6 10.5h3v3H6zM10.5 10.5h3v3h-3zM15 10.5h3v3h-3z" />
        <path d="M6 15h3v3H6zM10.5 15h3v3h-3zM15 15h3v3h-3z" />
      </svg>
    ),
  },
  {
    id: "login",
    label: "Login",
    href: "/login",
    match: (p) => p === "/login" || p.startsWith("/partner/login"),
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-3.87 3.58-6 8-6s8 2.13 8 6" />
      </svg>
    ),
  },
  {
    id: "lacak",
    label: "Lacak",
    href: "/track-order",
    match: (p) => p.startsWith("/track-order"),
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    ),
  },
  {
    id: "tentang",
    label: "Tentang",
    href: "/tentang",
    match: (p) => p.startsWith("/tentang"),
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-cream-2 bg-cream/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-6px_24px_-12px_rgba(16,32,30,0.18)] backdrop-blur-sm md:hidden"
    >
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const isActive = tab.match(pathname ?? "");

          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 pb-2 pt-2.5 transition-colors",
                isActive
                  ? "text-teal-deep"
                  : "text-ink-soft hover:text-teal-deep",
              )}
            >
              <span
                className={cn(
                  "flex h-7 items-center justify-center rounded-full px-3 transition-colors",
                  isActive ? "bg-teal-deep text-cream" : "",
                )}
              >
                {tab.icon}
              </span>
              <span className="text-xs font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
