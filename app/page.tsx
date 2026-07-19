import Image from "next/image";
import { Section } from "@/components/sections/Section";
import { Button } from "@/components/ui/Button";
import { HomepagePromoSection } from "@/components/home/HomepagePromoSection";
import { getCatalogProducts } from "@/lib/services/product.service";
import type { Product } from "@/types";

const REASONS = [
  { title: "Bahan Alami", description: "Jamur pilihan tanpa pengawet berlebihan." },
  { title: "Tekstur Renyah", description: "Kerenyahan terjaga sampai ke gigitan terakhir." },
  { title: "Rasa Autentik", description: "Diracik khusus untuk lidah Indonesia." },
  { title: "Kemasan Rapi", description: "Tetap segar dan higienis." },
] as const;

function groupProductsByPromo(products: Product[]) {
  const promoGroups = new Map<string, Product[]>();
  const nonPromoProducts: Product[] = [];

  for (const product of products) {
    if (product.has_active_promo && product.promo_name) {
      const existing = promoGroups.get(product.promo_name) || [];
      existing.push(product);
      promoGroups.set(product.promo_name, existing);
    } else {
      nonPromoProducts.push(product);
    }
  }

  return { promoGroups, nonPromoProducts };
}

export default async function Home() {
  const products = await getCatalogProducts();
  const { promoGroups, nonPromoProducts } = groupProductsByPromo(products);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#2c1810] text-white">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/images/hero/hero.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 md:py-28">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div className="space-y-6 text-center md:text-left">
              <p className="text-sm font-medium uppercase tracking-widest text-secondary-light">
                D&apos;JAEMO Jamur Krispi Premium
              </p>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Renyah. Gurih. Berkualitas.
              </h1>
              <div className="pt-2">
                <Button href="/produk" variant="secondary" className="px-8 py-3 text-base">
                  Beli Sekarang
                </Button>
              </div>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-sm md:mx-0 md:max-w-none">
              <Image
                src="/images/hero/balado.png"
                alt="D'JAEMO Jamur Krispi"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 80vw, 40vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Promo Sections ── */}
      {Array.from(promoGroups.entries()).map(([promoName, promoProducts]) => {
        const countdown = promoProducts[0]?.promo_countdown;
        return (
          <HomepagePromoSection
            key={promoName}
            promoName={promoName}
            countdown={countdown}
            products={promoProducts}
          />
        );
      })}

      {/* ── Produk Normal ── */}
      {nonPromoProducts.length > 0 && (
        <Section>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">
              Produk Kami
            </h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {nonPromoProducts.map((product) => (
              <HomepageProductCard key={product.id} product={product} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Mengapa D'JAEMO ── */}
      <Section className="bg-surface-dark">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">
            Mengapa D&apos;JAEMO?
          </h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
          {REASONS.map((reason) => (
            <div
              key={reason.title}
              className="rounded-2xl border border-primary/10 bg-white p-6 text-center shadow-sm"
            >
              <p className="font-semibold text-primary">{reason.title}</p>
              <p className="mt-2 text-sm text-muted">{reason.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Testimoni Customer ── */}
      <Section>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">
            Testimoni Customer
          </h2>
        </div>
        <p className="mt-4 text-center text-lg font-semibold text-primary">
          100+ Customer telah mempercayai D&apos;JAEMO
        </p>
      </Section>
    </>
  );
}

function HomepageProductCard({ product }: { product: Product }) {
  const imageSrc = product.images?.[0] || "/images/produk/placeholder.svg";
  const productUrl = `/produk/${product.id}`;

  return (
    <a
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
          <p className="text-2xl font-bold text-secondary">
            {product.final_price.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}
          </p>
        </div>

        <div className="mt-4">
          <span className="inline-block rounded-full border border-primary/20 px-5 py-2 text-xs font-medium text-primary/60 transition-colors duration-200 group-hover:border-primary/40 group-hover:text-primary">
            Lihat Produk
          </span>
        </div>
      </div>
    </a>
  );
}
