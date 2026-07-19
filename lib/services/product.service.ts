import { findCatalog, findById } from "@/lib/repositories/product.repository";
import { PromoEngine } from "@/lib/services/promo-engine";
import type { Product, ProductRow } from "@/types";

type ProductCountdown = NonNullable<Product["promo_countdown"]>;

async function enrichProductWithPromo(product: Product): Promise<Product> {
  const promo = await PromoEngine.getActivePromo(product.id);

  if (!promo) {
    return {
      ...product,
      has_active_promo: false,
      normal_price: product.price,
      final_price: product.price,
      promo_price: null,
      discount_amount: 0,
      promo_name: null,
      promo_status: null,
      promo_countdown: null,
    };
  }

  const promoProduct = promo.promo_products.find((pp) => pp.product_id === product.id);
  const promoPrice = promoProduct?.promo_price ?? product.price;
  const statusResult = PromoEngine.getPromoStatus(promo);
  const countdown = PromoEngine.getCountdown(promo);

  const countdownData: ProductCountdown = {
    value: countdown.value,
    unit: countdown.unit,
    direction: countdown.direction,
    type: countdown.type,
    display: countdown.display,
  };

  return {
    ...product,
    has_active_promo: true,
    normal_price: product.price,
    final_price: promoPrice,
    promo_price: promoPrice,
    discount_amount: product.price - promoPrice,
    promo_name: promo.name,
    promo_status: statusResult.status,
    promo_countdown: countdownData,
  };
}

function rowToProduct(row: ProductRow): Product {
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

export async function getCatalogProducts(): Promise<Product[]> {
  const data: ProductRow[] = await findCatalog();
  const products = data.map(rowToProduct);
  return Promise.all(products.map(enrichProductWithPromo));
}

export async function getProductById(id: string): Promise<Product | null> {
  const data = await findById(id);
  if (!data) return null;
  const product = rowToProduct(data);
  return enrichProductWithPromo(product);
}
