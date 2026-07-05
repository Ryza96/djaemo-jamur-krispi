import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface ProdukGridProps {
  products: Product[];
}

export function ProdukGrid({ products }: ProdukGridProps) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
