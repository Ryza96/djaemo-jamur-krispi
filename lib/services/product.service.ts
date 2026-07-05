import { findCatalog, findById } from "@/lib/repositories/product.repository";
import type { Product, ProductRow } from "@/types";

export async function getCatalogProducts(): Promise<Product[]> {
  const data: ProductRow[] = await findCatalog();
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    weight: p.weight,
    images: (p.product_images || []).map((img) => img.image_url),
  }));
}

export async function getProductById(id: string): Promise<Product | null> {
  const data = await findById(id);
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    price: data.price,
    weight: data.weight,
    images: (data.product_images || []).map((img) => img.image_url),
  };
}
