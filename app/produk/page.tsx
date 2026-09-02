import type { Metadata } from "next";
import { ProdukCatalog } from "@/components/produk/ProdukCatalog";
import type { Product } from "@/types";

export const metadata: Metadata = {
  title: "Produk",
  description:
    "Pilih varian jamur krispi favoritmu — D'Jaemo Jamur Krispi premium, digoreng fresh, dikemas rapi dalam kemasan 72 g.",
};

async function getProducts(): Promise<Product[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/products`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function ProdukPage() {
  const products = await getProducts();

  return (
    <>
      {/* PAGE HERO — hijau gelap, sesuai design yang disetujui */}
      <section className="relative overflow-hidden border-b border-teal-line bg-teal-deep px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-gold">
            Produk D&apos;Jaemo
          </p>
          <h1 className="mt-4 font-display text-[40px] font-semibold leading-[1.08] tracking-tight text-cream md:text-[52px] lg:text-[60px]">
            Pilih <em className="not-italic text-gold-bright">Favoritmu.</em>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/70 md:text-lg">
            Jamur krispi premium, digoreng fresh, dan dikemas rapi dalam kemasan
            72 g. Setiap kemasan disiapkan setelah kamu memesan — dikirim aman
            sampai tujuan.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <span className="rounded-full border border-gold/25 bg-white/5 px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-widest text-cream/85">
              {products.length} varian rasa
            </span>
            <span className="rounded-full border border-gold/25 bg-white/5 px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-widest text-cream/85">
              72 g per kemasan
            </span>
            <span className="rounded-full border border-gold/25 bg-white/5 px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-widest text-cream/85">
              Fresh setiap hari
            </span>
          </div>
        </div>
      </section>

      {products.length === 0 ? (
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <p className="text-lg text-muted">Belum ada produk tersedia.</p>
          <p className="mt-2 text-sm text-muted">Silakan kembali lagi nanti.</p>
        </section>
      ) : (
        <ProdukCatalog products={products} />
      )}
    </>
  );
}