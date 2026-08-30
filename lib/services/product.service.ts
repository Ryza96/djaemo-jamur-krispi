import {
  findCatalog,
  findById,
  findSoldQuantities,
} from "@/lib/repositories/product.repository";
import { resolveTransactionPrice } from "@/lib/services/pricing-authority";
import { PromoService } from "@/lib/services/promo.service";
import { PromoEngine } from "@/lib/services/promo-engine";
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

export async function getBestSellers(count: number): Promise<Product[]> {
  const allProducts = await getCatalogProducts();
  if (count <= 0) return [];

  const sold = await findSoldQuantities();
  const soldMap = new Map(sold.map((s) => [s.product_id, s.total_quantity]));

  const ranked = [...allProducts]
    .filter((p) => p.stock > 0)
    .sort((a, b) => (soldMap.get(b.id) ?? 0) - (soldMap.get(a.id) ?? 0));

  return ranked.slice(0, count);
}

export interface HomepagePromoData {
  promoName: string;
  countdown: Product["promo_countdown"];
  products: Product[];
}

export async function getHomepagePromo(): Promise<HomepagePromoData | null> {
  const promo = await PromoService.getHomepagePromo();
  if (!promo) return null;

  const allProducts = await getCatalogProducts();
  const promoIds = new Set(promo.promo_products.map((pp) => pp.product_id));
  const products = allProducts.filter((p) => promoIds.has(p.id) && p.stock > 0);
  if (products.length === 0) return null;

  const countdownResult = PromoEngine.getCountdown(promo);
  const countdown: NonNullable<Product["promo_countdown"]> = {
    value: countdownResult.value,
    unit: countdownResult.unit,
    direction: countdownResult.direction,
    type: countdownResult.type,
    display: countdownResult.display,
  };

  return { promoName: promo.name, countdown, products };
}
