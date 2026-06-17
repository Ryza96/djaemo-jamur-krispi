"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/types";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";

interface ProdukGridProps {
  products: Product[];
}

export function ProdukGrid({ products }: ProdukGridProps) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const handleAddToCart = (product: Product) => {
    setAddingToCart(product.id);
    addToCart(product);
    showToast(`${product.name} ditambahkan ke keranjang`, "success");
    
    // Reset button state after animation
    setTimeout(() => {
      setAddingToCart(null);
    }, 600);
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <article
          key={product.id}
          className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="relative aspect-square bg-surface-dark">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-primary">{product.name}</h2>
              <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                {product.weight}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{product.description}</p>
            <p className="mt-4 text-lg font-bold text-secondary">
              {formatPrice(product.price)}
            </p>
            <Button
              className={`mt-4 w-full transition-all duration-300 ${
                addingToCart === product.id ? "scale-95 opacity-75" : "scale-100 opacity-100"
              }`}
              variant="secondary"
              onClick={() => handleAddToCart(product)}
              disabled={addingToCart === product.id}
            >
              {addingToCart === product.id ? "Ditambahkan..." : "Add to Cart"}
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
