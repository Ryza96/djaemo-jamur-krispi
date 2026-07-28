import type { Product } from "@/types";

export type CustomerType = "CUSTOMER" | "RESELLER" | "DROPSHIPPER";

export interface PricingContext {
  customerType?: CustomerType;
  quantity?: number;
  voucherCode?: string;
  membershipTier?: string;
  bundleId?: string;
}

export interface PriceResolution {
  final_price: number;
  normal_price: number;
  discount_amount: number;
  has_active_promo: boolean;
  promo_price: number | null;
  promo_name: string | null;
  promo_status: string | null;
  promo_countdown: NonNullable<Product["promo_countdown"]> | null;
}

export interface PricingRule {
  name: string;
  priority: number;
  evaluate(
    product: Product,
    context: PricingContext,
  ): Promise<PriceResolution | null>;
}
