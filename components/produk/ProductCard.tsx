"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { PromoBadge } from "@/components/promo";
import { PartnerPriceDisplay } from "@/components/partner/PartnerPriceDisplay";
import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/ui/Toast";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const imageSrc = product.images?.[0] || "/images/produk/placeholder.svg";
  const productUrl = `/produk/${product.id}`;
  const showPromo = product.has_active_promo && product.promo_status !== "upcoming";
  const displayData = showPromo ? product : { ...product, has_active_promo: false };

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, 1);
    showToast(`${product.name} ditambahkan ke keranjang`, "success");
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gold/25 bg-cream shadow-sm transition-all duration-200 hover:border-teal-deep/40 hover:shadow-md">
      <Link
        href={productUrl}
        className="relative block aspect-square overflow-hidden bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        aria-label={`Lihat produk ${product.name}`}
      >
        <Image
          unoptimized={process.env.NODE_ENV === "development"}
          src={imageSrc}
          alt={product.name}
          fill
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {showPromo && (
          <div className="absolute left-3 top-3">
            <PromoBadge data={displayData} variant="compact" />
          </div>
        )}
      </Link>

      <div className="relative z-10 -mt-10 flex flex-1 flex-col rounded-t-2xl bg-white p-4 sm:p-5">
        <Link
          href={productUrl}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <h3 className="line-clamp-2 min-h-12 text-base font-semibold text-ink transition-colors duration-200 group-hover:text-teal-deep sm:min-h-14 sm:text-lg">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full border border-teal-deep/15 bg-teal-deep/5 px-2 py-0.5 font-mono text-xs font-medium text-teal-deep">
            {product.weight}
          </span>
        </div>

        <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-ink-soft">
          {product.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-gold/15 pt-3 sm:gap-3">
          <div className="shrink-0">
            <span className="mb-1 block font-mono text-[11px] font-medium uppercase tracking-widest text-teal-deep/70">
              Harga
            </span>
            <div className="[&_.font-mono]:text-xl">
              <PartnerPriceDisplay product={product} variant="inline" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            className="min-w-0 rounded-full bg-red px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-red/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAdding ? "Adding..." : "Add To Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
