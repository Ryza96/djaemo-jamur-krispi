"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/types";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, quantity);
    showToast(`${product.name} ditambahkan ke keranjang`, "success");
    setTimeout(() => setIsAdding(false), 600);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push("/checkout");
  };

  const isMinQuantity = quantity <= 1;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-ink" id="quantity-label">
          Jumlah
        </label>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={isMinQuantity}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors duration-200 hover:bg-teal-deep/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Kurangi jumlah"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="min-w-[2rem] text-center text-lg font-semibold text-foreground" aria-live="polite" aria-atomic="true">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors duration-200 hover:bg-teal-deep/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep focus-visible:ring-offset-2"
            aria-label="Tambah jumlah"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAdding}
        className="w-full rounded-full bg-gold px-6 py-3 text-base font-semibold text-teal-deep transition-all duration-200 hover:bg-gold-bright active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAdding ? "Ditambahkan..." : "Tambah ke Keranjang"}
      </button>

      <button
        type="button"
        onClick={handleBuyNow}
        className="w-full rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-teal-deep transition-all duration-200 hover:bg-gold-bright active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        Beli Sekarang
      </button>
    </div>
  );
}
