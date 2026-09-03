"use client";

import type { Product } from "@/types";
import { ProdukGrid } from "@/components/produk/ProdukGrid";

interface ProdukCatalogProps {
  products: Product[];
}

export function ProdukCatalog({ products }: ProdukCatalogProps) {
  return (
    <section className="mx-auto w-full min-w-0 max-w-6xl px-4 py-16 sm:px-6 md:py-20">
      <div className="flex items-center justify-between border-b border-cream-2 pb-5">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft/75">
          {products.length} produk
        </p>
      </div>

      <div className="mt-8">
        <ProdukGrid products={products} />
      </div>
    </section>
  );
}