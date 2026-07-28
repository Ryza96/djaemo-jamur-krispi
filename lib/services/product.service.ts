import { findCatalog, findById } from "@/lib/repositories/product.repository";
import { resolveTransactionPrice } from "@/lib/services/pricing-authority";
import type { Product, ProductRow } from "@/types";

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    weight: row.weight,
    stock: row.stock,
    images: (row.product_images || []).map((img) => img.image_url),
    has_active_promo: false,
    normal_price: row.price,
    final_price: row.price,
    promo_price: null,
    discount_amount: 0,
    promo_name: null,
    promo_status: null,
    promo_countdown: null,
  };
}

async function enrichProduct(product: Product): Promise<Product> {
  const resolution = await resolveTransactionPrice(product);
  return { ...product, ...resolution };
}

export async function getCatalogProducts(): Promise<Product[]> {
  const data: ProductRow[] = await findCatalog();
  const products = data.map(rowToProduct);
  return Promise.all(products.map(enrichProduct));
}

export async function getProductById(id: string): Promise<Product | null> {
  const data = await findById(id);
  if (!data) return null;
  const product = rowToProduct(data);
  return enrichProduct(product);
}
