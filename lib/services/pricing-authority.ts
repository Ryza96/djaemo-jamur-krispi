import type { Product } from "@/types";
import type { PricingContext, PriceResolution } from "./pricing/types";
import { PromoRule, buildNoPromoResolution } from "./pricing/rules/promo.rule";

const rules = [PromoRule].sort((a, b) => a.priority - b.priority);

export type { PricingContext, PriceResolution } from "./pricing/types";

export async function resolveTransactionPrice(
  product: Product,
  context?: PricingContext,
): Promise<PriceResolution> {
  const ctx = context ?? {};

  for (const rule of rules) {
    const result = await rule.evaluate(product, ctx);
    if (result) return result;
  }

  return buildNoPromoResolution(product.price);
}
