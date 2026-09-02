import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/sections/Section";
import { Button } from "@/components/ui/Button";
import { PartnerPriceDisplay } from "@/components/partner/PartnerPriceDisplay";
import type { Product } from "@/types";

interface BestSellerSectionProps {
  products: Product[];
  embedded?: boolean;
}

function BestSellerCard({ product }: { product: Product }) {
  const imageSrc = product.images?.[0] || "/images/produk/placeholder.svg";
  const productUrl = `/produk/${product.id}`;

  return (
    <Link
      href={productUrl}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-2">
        <Image
          unoptimized={process.env.NODE_ENV === "development"}
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-col gap-2 p-5">
        {product.weight && (
          <span className="inline-flex w-fit items-center rounded-full bg-cream px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-widest text-ink-soft">
            {product.weight}
          </span>
        )}
        <h3 className="line-clamp-2 text-base font-semibold text-ink">
          {product.name}
        </h3>

        {product.description && (
          <p className="line-clamp-2 text-sm leading-snug text-ink-soft">
            {product.description}
          </p>
        )}

        <div className="[&_.font-mono]:text-lg [&_.font-mono]:font-semibold [&_.font-mono]:text-teal-deep [&_.font-mono]:tracking-tight">
          <PartnerPriceDisplay product={product} variant="inline" />
        </div>

        <span className="mt-auto inline-flex w-full items-center justify-center rounded-lg bg-gold px-4 py-3 text-sm font-semibold text-teal-deep transition-colors duration-200 group-hover:bg-gold-bright focus-visible:outline-none">
          Lihat Produk
        </span>
      </div>
    </Link>
  );
}

export function BestSellerSection({ products, embedded = false }: BestSellerSectionProps) {
  const bestSellers = products.slice(0, 3);

  if (bestSellers.length === 0) return null;

  const content = (
    <>
      <div className="text-center">
        <p className="font-mono text-sm font-medium uppercase tracking-widest text-gold">
          Favorit Pelanggan
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink md:text-4xl">
          Best Seller Kami
        </h2>
        <p className="mt-3 text-base text-ink-soft">
          Produk pilihan yang paling disukai customer
        </p>
      </div>

      <div className="mt-12 grid gap-6 text-left sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {bestSellers.map((product) => (
          <BestSellerCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button
          href="/produk"
          variant="secondary"
          className="rounded-lg px-8 py-3 text-teal-deep hover:bg-gold-bright"
        >
          Lihat Semua Produk
        </Button>
      </div>
    </>
  );

  if (embedded) return content;

  return <Section className="py-16 md:py-[84px]">{content}</Section>;
}
