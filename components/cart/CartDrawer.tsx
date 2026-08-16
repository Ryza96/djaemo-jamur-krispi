"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { decideResume } from "@/lib/checkout/resumeOrder";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

function useFocusTray(ref: React.RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    if (!open || !ref.current) return;

    const drawer = ref.current;
    const focusable = drawer.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    drawer.addEventListener("keydown", handleKeyDown);
    return () => drawer.removeEventListener("keydown", handleKeyDown);
  }, [open, ref]);
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeFromCart, totalItems, subtotal } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [resuming, setResuming] = useState(false);

  const handleResumeClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      setResuming(true);
      try {
        const resume = await decideResume();
        if (resume.kind === "resume") {
          e.preventDefault();
          window.location.href = resume.redirectUrl;
        }
      } finally {
        onClose();
        setResuming(false);
      }
    },
    [onClose],
  );

  useFocusTray(drawerRef, open);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keranjang Belanja"
        className={`fixed inset-y-0 right-0 z-[70] flex w-full flex-col bg-surface shadow-2xl transition-transform duration-300 sm:w-[420px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-primary/10 px-6 py-5">
          <h2 className="text-lg font-semibold text-foreground">
            Keranjang
            {totalItems > 0 && (
              <span className="ml-2 text-sm font-normal text-muted">
                ({totalItems})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary/5 hover:text-foreground"
            aria-label="Tutup keranjang"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-dark">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-muted" fill="currentColor" aria-hidden="true">
                <path d="M7 4h10l1.5 6H6.5L7 4zm0 8h10l1.5 6H5.5L7 12zm-1.5-8l-1 4h16l-1-4H5.5z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Keranjang kosong</p>
            <p className="mt-1 text-xs text-muted">
              Tambahkan produk dari halaman Produk.
            </p>
            <Link
              href="/produk"
              onClick={onClose}
              className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
            >
              Lihat Produk
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {items.map((item) => (
                <CartItemRow
                  key={item.product.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                  compact
                />
              ))}
            </div>

            <div className="border-t border-primary/10 px-6 py-5">
              <CartSummary items={items} />

              <div className="mt-5 space-y-3">
                <Link
                  href="/checkout"
                  onClick={handleResumeClick}
                  aria-disabled={resuming}
                  className={`flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light ${
                    resuming ? "pointer-events-none opacity-70" : ""
                  }`}
                >
                  {resuming ? "Mengalihkan..." : "Lanjutkan Pembayaran"}
                </Link>
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="flex w-full items-center justify-center rounded-full border border-primary/20 px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5"
                >
                  Lihat Keranjang
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
