import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageSrc = product.images?.[0] || "/images/produk/placeholder.svg";
  const productUrl = `/produk/${product.id}`;

  return (
    <Link
      href={productUrl}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`Lihat produk ${product.name}`}
    >
      <article>
        <div className="relative aspect-square">
          <Image
            unoptimized={process.env.NODE_ENV === "development"}
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        <div className="mt-8 sm:mt-10">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-base font-medium text-primary sm:text-lg">
              {product.name}
            </h3>
            <span className="shrink-0 text-xs text-muted">
              {product.weight}
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-secondary sm:text-3xl">
            {formatPrice(product.price)}
          </p>
        </div>

        <div className="mt-8">
          <span className="inline-block rounded-full border border-primary/20 px-5 py-2 text-xs font-medium text-primary/60 transition-colors duration-200 group-hover:border-primary/40 group-hover:text-primary">
            Lihat Produk
          </span>
        </div>
      </article>
    </Link>
  );
}
