import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface ProdukGridProps {
  products: Product[];
}

export function ProdukGrid({ products }: ProdukGridProps) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-10">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
