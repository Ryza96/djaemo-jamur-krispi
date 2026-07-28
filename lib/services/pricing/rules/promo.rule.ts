import { PromoEngine } from "@/lib/services/promo-engine";
import type { Product } from "@/types";
import type { PricingContext, PricingRule, PriceResolution } from "../types";

type ProductCountdown = NonNullable<Product["promo_countdown"]>;

function buildNoPromoResolution(price: number): PriceResolution {
  return {
    final_price: price,
    normal_price: price,
    promo_price: null,
    discount_amount: 0,
    has_active_promo: false,
    promo_name: null,
    promo_status: null,
    promo_countdown: null,
  };
}

export const PromoRule: PricingRule = {
  name: "promo",
  priority: 10,

  async evaluate(
    product: Product,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: PricingContext,
  ): Promise<PriceResolution | null> {
    const promo = await PromoEngine.getActivePromo(product.id);

    if (!promo) {
      return null;
    }

    const promoProduct = promo.promo_products.find(
      (pp) => pp.product_id === product.id,
    );
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
      final_price: promoPrice,
      normal_price: product.price,
      promo_price: promoPrice,
      discount_amount: product.price - promoPrice,
      has_active_promo: true,
      promo_name: promo.name,
      promo_status: statusResult.status,
      promo_countdown: countdownData,
    };
  },
};

export { buildNoPromoResolution };
