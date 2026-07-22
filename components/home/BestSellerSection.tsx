import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/sections/Section";
import { Button } from "@/components/ui/Button";
import { PartnerPriceDisplay } from "@/components/partner/PartnerPriceDisplay";
import type { Product } from "@/types";

interface BestSellerSectionProps {
  products: Product[];
}

function BestSellerCard({ product }: { product: Product }) {
  const imageSrc = product.images?.[0] || "/images/produk/placeholder.svg";
  const productUrl = `/produk/${product.id}`;

  return (
    <Link
      href={productUrl}
      className="group block rounded-2xl border border-primary/10 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-5"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl">
        <Image
          unoptimized={process.env.NODE_ENV === "development"}
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="mt-4 text-center">
        <h3 className="text-base font-semibold text-primary sm:text-lg">{product.name}</h3>

        <div className="mt-3">
          <PartnerPriceDisplay product={product} variant="inline" className="items-center" />
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

export function BestSellerSection({ products }: BestSellerSectionProps) {
  const bestSellers = products.slice(0, 3);

  if (bestSellers.length === 0) return null;

  return (
    <Section>
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-secondary">
          Terlaris
        </p>
        <h2 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
          Best Seller Kami
        </h2>
        <p className="mt-3 text-muted">
          Produk pilihan yang paling disukai customer
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {bestSellers.map((product) => (
          <BestSellerCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Button href="/produk" variant="primary" className="px-8 py-3">
          Lihat Semua Produk
        </Button>
      </div>
    </Section>
  );
}
