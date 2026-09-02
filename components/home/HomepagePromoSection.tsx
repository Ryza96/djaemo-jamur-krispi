import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/sections/Section";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface PromoSectionProps {
  promoName: string;
  countdown: Product["promo_countdown"];
  products: Product[];
}

export function HomepagePromoSection({ products }: PromoSectionProps) {
  if (products.length === 0) return null;

  const isSingle = products.length === 1;

  return (
    <Section className="bg-[linear-gradient(135deg,var(--gold),var(--gold-bright))]">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#2b220d]/75 sm:text-sm">
          Promo Hari Ini
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-[#2b220d] sm:text-4xl md:text-[38px]">
          Bundle 3 Varian
        </h2>
        <p className="mt-3 font-mono text-xs font-medium text-[#2b220d]/75 sm:text-sm">
          Berlaku hingga 3 PRODUK · hemat sampai habis kuota
        </p>
      </div>

      <div
        className={
          isSingle
            ? "mx-auto mt-10 grid max-w-sm gap-6"
            : "mt-10 grid gap-6 sm:grid-cols-2 md:gap-7 lg:grid-cols-3"
        }
      >
        {products.map((product) => (
          <PromoCard key={product.id} product={product} />
        ))}
      </div>
    </Section>
  );
}

function PromoCard({ product }: { product: Product }) {
  const imageSrc = product.images?.[0] || "/images/produk/placeholder.svg";

  const hasDiscount =
    product.has_active_promo &&
    product.final_price > 0 &&
    product.normal_price > product.final_price;
  const discountPercent =
    hasDiscount && product.normal_price > 0
      ? Math.round(
          ((product.normal_price - product.final_price) / product.normal_price) *
            100
        )
      : 0;

  return (
    <Link
      href={`/produk/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white/95 shadow-[0_6px_20px_-6px_rgba(18,31,29,0.22)] transition-transform duration-200 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b220d]"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-2">
        <Image
          unoptimized={process.env.NODE_ENV === "development"}
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {hasDiscount && discountPercent > 0 && (
          <span className="absolute right-3 top-3 rounded-md bg-red px-2.5 py-1 font-mono text-xs font-bold text-white shadow-sm">
            Hemat {discountPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 py-4">
        <h3 className="text-sm font-bold leading-snug text-ink sm:text-base">
          {product.name}
        </h3>

        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-x-2.5">
            <span className="font-mono text-lg font-bold text-red">
              {formatPrice(product.final_price)}
            </span>
            {hasDiscount && (
              <span className="font-mono text-xs text-ink-soft line-through">
                {formatPrice(product.normal_price)}
              </span>
            )}
          </div>

          <span className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-gold px-5 py-2.5 font-mono text-xs font-bold text-[#2b220d] transition-colors duration-200 group-hover:bg-gold-bright">
            Lihat Produk
          </span>
        </div>
      </div>
    </Link>
  );
}
