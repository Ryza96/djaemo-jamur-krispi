import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/sections/Section";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
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
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-secondary">
          Promo Hari Ini
        </p>
        <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">
          {promoName}
        </h2>
        {countdown && (
          <p className="mt-3 text-lg text-muted">
            SISA : {countdown.value} {countdown.unit.toUpperCase()} {countdown.direction.toUpperCase()}
          </p>
        )}
        <p className="mt-2 text-sm text-muted">
          {products.length} PRODUK
        </p>
      </div>

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

        <div className="mt-3 space-y-1">
          <p className="text-lg font-bold text-secondary">
            {formatPrice(product.normal_price)}
          </p>
          <p className="text-xl font-bold text-primary">
            {formatPrice(product.final_price)}
          </p>
          <p className="text-sm font-medium text-green-600">
            HEMAT {formatPrice(product.discount_amount)}
          </p>
        </div>

        <div className="mt-4">
          <span className="inline-block rounded-full border border-primary/20 px-5 py-2 text-xs font-medium text-primary/60 transition-colors duration-200 group-hover:border-primary/40 group-hover:text-primary">
            Lihat Produk
          </span>
        </div>
      </div>
    </Link>
  );
}
