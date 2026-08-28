import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/sections/Section";
import { getProductById } from "@/lib/services/product.service";
import { ProductGallery } from "@/components/produk/detail/ProductGallery";
import { ProductInfo } from "@/components/produk/detail/ProductInfo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) return { title: "Produk Tidak Ditemukan" };
    const ogImage =
      product.images.length > 0 ? product.images[0] : undefined;
    return {
      title: product.name,
      description: product.description,
      openGraph: {
        title: product.name,
        description: product.description,
        images: ogImage ? [{ url: ogImage }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description: product.description,
        images: ogImage ? [ogImage] : [],
      },
    };
  } catch {
    return { title: "Produk Tidak Ditemukan" };
  }
}

export default async function ProdukDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  return (
    <Section>
      <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
        <ProductGallery images={product.images} productName={product.name} />
        <ProductInfo product={product} />
      </div>
    </Section>
  );
}
