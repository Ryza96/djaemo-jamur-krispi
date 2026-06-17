import type { Metadata } from "next";
import { products } from "@/data/products";
import { PageHeader, Section } from "@/components/sections/Section";
import { ProdukGrid } from "@/components/produk/ProdukGrid";

export const metadata: Metadata = {
  title: "Produk",
  description: "Lihat koleksi camilan jamur krispi Djaemo.",
};

export default function ProdukPage() {
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
