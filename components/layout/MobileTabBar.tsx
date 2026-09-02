"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";

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
    id: "keranjang",
    label: "Keranjang",
    href: "/cart",
    match: (p) => p === "/cart" || p.startsWith("/checkout"),
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M7 4h10l1.5 6H6.5L7 4z" />
        <path d="M7 12h10l1.5 6H5.5L7 12z" />
        <path d="M5.5 5H4.2a1 1 0 0 0-1 1.2L4 9" />
        <path d="M18.5 5h1.3a1 1 0 0 1 1 1.2L20 9" />
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
    id: "menu",
    label: "Menu",
    href: "",
    match: () => false,
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M4 6.5h16" />
        <path d="M4 12h16" />
        <path d="M4 17.5h16" />
      </svg>
    ),
  },
];

function MenuDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[75] rounded-t-3xl border-t border-cream-2 bg-white pb-[calc(env(safe-area-inset-bottom,0px)+16px)] shadow-2xl transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-cream-2" />
        <div className="flex items-center justify-between px-6 pb-2 pt-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft">
            Menu
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-cream hover:text-ink"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <nav className="grid grid-cols-2 gap-2 px-5 pt-2 sm:grid-cols-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="rounded-xl border border-cream-2 bg-cream px-3 py-3 text-center text-sm font-semibold text-ink transition-colors hover:border-gold hover:bg-gold/10"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/track-order"
            onClick={onClose}
            className="rounded-xl border border-cream-2 bg-cream px-3 py-3 text-center text-sm font-semibold text-ink transition-colors hover:border-gold hover:bg-gold/10"
          >
            Lacak Pesanan
          </Link>
          <Link
            href="/login"
            onClick={onClose}
            className="rounded-xl border border-cream-2 bg-cream px-3 py-3 text-center text-sm font-semibold text-ink transition-colors hover:border-gold hover:bg-gold/10"
          >
            Masuk
          </Link>
          <Link
            href="/partner"
            onClick={onClose}
            className="rounded-xl border border-cream-2 bg-cream px-3 py-3 text-center text-sm font-semibold text-ink transition-colors hover:border-gold hover:bg-gold/10"
          >
            Daftar Partner
          </Link>
        </nav>
      </div>
    </>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-cream-2 bg-cream/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-6px_24px_-12px_rgba(16,32,30,0.18)] backdrop-blur-sm md:hidden"
      >
        <div className="grid grid-cols-5">
          {TABS.map((tab) => {
            if (tab.id === "menu") {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Buka menu"
                  className="flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-ink-soft transition-colors hover:text-teal-deep"
                >
                  <span className="flex h-7 items-center justify-center">{tab.icon}</span>
                  <span className="text-xs font-semibold">{tab.label}</span>
                </button>
              );
            }

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
                    "relative flex h-7 items-center justify-center rounded-full px-3 transition-colors",
                    isActive ? "bg-teal-deep text-cream" : "",
                  )}
                >
                  {tab.icon}
                  {tab.id === "keranjang" && totalItems > 0 && (
                    <span
                      key={totalItems}
                      className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 font-mono text-xs font-semibold leading-none text-ink"
                    >
                      {totalItems > 99 ? "99+" : totalItems}
                    </span>
                  )}
                </span>
                <span className="text-xs font-semibold">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
