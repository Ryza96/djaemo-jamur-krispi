import type { Product } from "@/types";
import { PromoPrice, PromoBadge, PromoCountdown } from "@/components/promo";
import { ProductWeight } from "./ProductWeight";
import { ProductActions } from "./ProductActions";

interface ProductInfoProps {
  product: Product;
}

const checklist = [
  "Jamur Pilihan",
  "Tanpa Pengawet",
  "Digoreng Fresh",
  "Renyah Lebih Lama",
] as const;

export function ProductInfo({ product }: ProductInfoProps) {
  const showPromo = product.has_active_promo;

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold text-primary sm:text-3xl">
        {product.name}
      </h1>

      <div className="mt-2 flex items-center gap-2">
        <PromoPrice data={product} variant="detail" />
        {showPromo && (
          <PromoBadge data={product} variant="full" />
        )}
      </div>

      {showPromo && (
        <PromoCountdown data={product} variant="detail" className="mt-1" />
      )}

      <div className="mt-2 flex items-center gap-1.5">
        <div className="flex" aria-label="Rating 4.8 dari 5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              viewBox="0 0 20 20"
              className="h-4 w-4 text-secondary"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-sm text-muted">(4.8 · 24 ulasan)</span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
        {product.description}
      </p>

      <ul className="mt-4 space-y-2">
        {checklist.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-foreground">
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4 shrink-0 text-secondary"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <ProductWeight weight={product.weight} />
      </div>

      <hr className="my-4 border-primary/10" />

      <ProductActions product={product} />
    </div>
  );
}
