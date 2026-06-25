"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";

export function Header() {
  const currentPath = usePathname();
  const { totalItems } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = NAV_LINKS.filter((link) => link.href !== "/cart");

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo priority className="sm:gap-2" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Tutup menu" : "Buka menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/10 bg-white/95 text-foreground transition hover:border-primary hover:text-primary md:hidden"
            onClick={() => setIsOpen((value) => !value)}
          >
            <span className="sr-only">{isOpen ? "Tutup navigasi" : "Buka navigasi"}</span>
            {isOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M18.3 5.71a1 1 0 0 0-1.42 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.42 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.42L13.41 12l4.9-4.89a1 1 0 0 0 0-1.4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M4 6h16a1 1 0 1 0 0-2H4a1 1 0 1 0 0 2zm16 6H4a1 1 0 1 0 0 2h16a1 1 0 1 0 0-2zm0 6H4a1 1 0 1 0 0 2h16a1 1 0 1 0 0-2z" />
              </svg>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? currentPath === "/"
                  : (currentPath ?? "").startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                    isActive
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <Link
            href="/cart"
            title="Keranjang Belanja"
            aria-label={
              totalItems > 0
                ? `Keranjang Belanja, ${totalItems} item`
                : "Keranjang Belanja"
            }
            className={cn(
              "relative inline-flex items-center rounded-full border border-primary/10 bg-white/95 p-2 text-foreground transition-colors hover:border-primary hover:text-primary sm:p-3",
              (currentPath ?? "").startsWith("/cart") ? "bg-primary text-white" : "",
            )}
          >
            <span className="sr-only">Keranjang Belanja</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M7 4h10l1.5 6H6.5L7 4zm0 8h10l1.5 6H5.5L7 12zm-1.5-8l-1 4h16l-1-4H5.5z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-primary/10 bg-surface/95 px-4 py-4">
          <nav className="space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  currentPath === link.href
                    ? "bg-primary text-white"
                    : "text-foreground hover:bg-primary/10 hover:text-primary",
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
