import type { Product } from "@/types";
import { PromoBadge, PromoCountdown } from "@/components/promo";
import { PartnerPriceDisplay } from "@/components/partner/PartnerPriceDisplay";
import { ProductWeight } from "./ProductWeight";
import { ProductActions } from "./ProductActions";
import { LikeButton } from "./LikeButton";

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
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink md:text-[30px]">
        {product.name}
      </h1>

      <div className="mt-2 flex items-center gap-2">
        <PartnerPriceDisplay product={product} variant="detail" />
        {showPromo && (
          <PromoBadge data={product} variant="full" />
        )}
      </div>

      {showPromo && (
        <PromoCountdown data={product} variant="detail" className="mt-1" />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-deep/5 px-3 py-1 text-xs font-semibold text-teal-deep">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          100% Alami
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Premium
        </span>
        <LikeButton productId={product.id} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
        {product.description}
      </p>

      <ul className="mt-4 space-y-2">
        {checklist.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-foreground">
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4 shrink-0 text-gold"
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

      <hr className="my-4 border-ink/10" />

      <ProductActions product={product} />
    </div>
  );
}
