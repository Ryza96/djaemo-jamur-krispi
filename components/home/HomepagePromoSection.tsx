import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/sections/Section";
import { PromoSectionHeader, PromoPrice, PromoBadge } from "@/components/promo";
import type { Product } from "@/types";

interface PromoSectionProps {
  promoName: string;
  countdown: Product["promo_countdown"];
  products: Product[];
}

export function HomepagePromoSection({ promoName, countdown, products }: PromoSectionProps) {
  if (products.length === 0) return null;

  return (
    <Section className="bg-secondary/10">
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
      className="group block rounded-2xl border border-primary/10 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
        <h3 className="text-base font-semibold text-primary">{product.name}</h3>

        <div className="mt-3">
          <PromoPrice data={product} variant="inline" className="items-center" />
        </div>

        {product.has_active_promo && (
          <div className="mt-2 flex justify-center">
            <PromoBadge data={product} variant="compact" />
          </div>
        )}

        <div className="mt-4">
          <span className="inline-block rounded-full border border-primary/20 px-5 py-2 text-xs font-medium text-primary/60 transition-colors duration-200 group-hover:border-primary/40 group-hover:text-primary">
            Lihat Produk
          </span>
        </div>
      </div>
    </Link>
  );
}
