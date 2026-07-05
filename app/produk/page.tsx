import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/sections/Section";
import { ProdukGrid } from "@/components/produk/ProdukGrid";
import type { Product } from "@/types";

export const metadata: Metadata = {
  title: "Produk",
  description: "Lihat koleksi camilan jamur krispi Djaemo.",
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

  if (products.length === 0) {
    return (
      <Section>
        <PageHeader
          title="Produk Kami"
          description="Pilih varian jamur krispi favorit Anda. Semua produk dibuat dari bahan alami pilihan."
        />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg text-muted">Belum ada produk tersedia.</p>
          <p className="mt-2 text-sm text-muted">Silakan kembali lagi nanti.</p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <PageHeader
        title="Produk Kami"
        description="Pilih varian jamur krispi favorit Anda. Semua produk dibuat dari bahan alami pilihan."
      />
      <ProdukGrid products={products} />
    </Section>
  );
}
