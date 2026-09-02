"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/types";
import { ProdukGrid } from "@/components/produk/ProdukGrid";
import { cn } from "@/lib/utils";

const FLAVOR_KEYWORDS: Array<{ label: string; match: string }> = [
  { label: "Pedas Manis", match: "pedas manis" },
  { label: "Balado", match: "balado" },
  { label: "Asam Manis", match: "asam manis" },
  { label: "IGA", match: "iga" },
];

function classifyFlavor(name: string): string {
  const n = name.toLowerCase();
  for (const f of FLAVOR_KEYWORDS) {
    if (n.includes(f.match)) return f.label;
  }
  return "Lainnya";
}

interface ProdukCatalogProps {
  products: Product[];
}

export function ProdukCatalog({ products }: ProdukCatalogProps) {
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = ["Semua"];
    for (const p of products) {
      const label = classifyFlavor(p.name);
      if (!seen.has(label)) {
        seen.add(label);
        list.push(label);
      }
    }
    return list;
  }, [products]);

  const [active, setActive] = useState("Semua");

  const filtered = useMemo(
    () =>
      active === "Semua"
        ? products
        : products.filter((p) => classifyFlavor(p.name) === active),
    [active, products],
  );

  return (
    <section className="mx-auto w-full min-w-0 max-w-[1180px] px-6 py-10 md:py-14">
      {/* KATEGORI FILTER — chips dari data produk asli */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-2 pb-5">
        <div className="flex min-w-0 gap-2 overflow-x-auto" role="group" aria-label="Kategori produk">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              aria-pressed={active === cat}
              className={cn(
                "shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
                active === cat
                  ? "bg-teal-deep text-cream"
                  : "border border-cream-2 bg-white text-ink-soft hover:border-teal-mid hover:text-teal-deep",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-soft/70">
          {filtered.length} produk
        </p>
      </div>

      <div className="mt-8">
        <ProdukGrid products={filtered} />
      </div>
    </section>
  );
}