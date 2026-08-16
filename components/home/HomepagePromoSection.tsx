import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/sections/Section";
import { PromoSectionHeader, PromoBadge } from "@/components/promo";
import { PartnerPriceDisplay } from "@/components/partner/PartnerPriceDisplay";
import type { Product } from "@/types";

interface PromoSectionProps {
  promoName: string;
  countdown: Product["promo_countdown"];
  products: Product[];
}

export function HomepagePromoSection({ promoName, countdown, products }: PromoSectionProps) {
  if (products.length === 0) return null;

  return (
    <Section className="bg-gold/5">
      <PromoSectionHeader
        name={promoName}
        countdown={countdown}
        productCount={products.length}
      />

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <HomepageProductCard key={product.id} product={product} />
        ))}
      </div>
    </Section>
  );
}

function HomepageProductCard({ product }: { product: Product }) {
  const imageSrc = product.images?.[0] || "/images/produk/placeholder.svg";
  const productUrl = `/produk/${product.id}`;

  return (
    <Link
      href={productUrl}
      className="group block rounded-2xl border border-gold/30 bg-white p-4 shadow-sm transition-all duration-200 hover:-rotate-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl">
        <Image
          unoptimized={process.env.NODE_ENV === "development"}
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="mt-4 text-center">
        <h3 className="text-base font-semibold text-ink">{product.name}</h3>

        <div className="mt-3">
          <PartnerPriceDisplay product={product} variant="inline" className="items-center" />
        </div>

        {product.has_active_promo && (
          <div className="mt-2 flex justify-center">
            <PromoBadge data={product} variant="compact" />
          </div>
        )}

        <div className="mt-4">
          <span className="inline-block rounded-full border border-gold/30 px-5 py-2 font-mono text-xs font-medium text-ink-soft transition-colors duration-200 group-hover:border-gold group-hover:text-ink">
            Lihat Produk
          </span>
        </div>
      </div>
    </Link>
  );
}
