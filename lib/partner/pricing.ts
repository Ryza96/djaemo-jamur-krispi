import type { PartnerStatus } from "@/components/partner/PartnerAuthProvider";
import type { Product } from "@/types";

export type PriceTier = "customer" | "reseller" | "dropshipper";

export interface PartnerPricingRule {
  productId: string;
  customerPrice: number;
  resellerPrice: number;
  dropshipperPrice: number;
}

export const MOCK_PRICING_RULES: PartnerPricingRule[] = [
  {
    productId: "1",
    customerPrice: 25000,
    resellerPrice: 17000,
    dropshipperPrice: 20000,
  },
  {
    productId: "2",
    customerPrice: 30000,
    resellerPrice: 20000,
    dropshipperPrice: 24000,
  },
  {
    productId: "3",
    customerPrice: 35000,
    resellerPrice: 23000,
    dropshipperPrice: 28000,
  },
  {
    productId: "4",
    customerPrice: 28000,
    resellerPrice: 18500,
    dropshipperPrice: 22500,
  },
  {
    productId: "5",
    customerPrice: 32000,
    resellerPrice: 21000,
    dropshipperPrice: 26000,
  },
  {
    productId: "6",
    customerPrice: 22000,
    resellerPrice: 14500,
    dropshipperPrice: 18000,
  },
];

function getStatusTier(status: PartnerStatus): PriceTier {
  switch (status) {
    case "RESELLER_ACTIVE":
      return "reseller";
    case "DROPSHIPPER_ACTIVE":
      return "dropshipper";
    default:
      return "customer";
  }
}

function getMockRule(productId: string): PartnerPricingRule | undefined {
  return MOCK_PRICING_RULES.find((r) => r.productId === productId);
}

function getPartnerLabel(tier: PriceTier): string | null {
  switch (tier) {
    case "reseller":
      return "Harga Reseller";
    case "dropshipper":
      return "Harga Dropshipper";
    default:
      return null;
  }
}

export function resolvePartnerPrice(
  product: Product,
  partnerStatus: PartnerStatus | null,
): {
  partnerPrice: number | null;
  partnerLabel: string | null;
  originalPrice: number;
} {
  const tier = getStatusTier(partnerStatus ?? "PENDING_REVIEW");
  const rule = getMockRule(product.id);

  if (tier === "customer" || !rule) {
    return {
      partnerPrice: null,
      partnerLabel: null,
      originalPrice: product.normal_price,
    };
  }

  const price =
    tier === "reseller" ? rule.resellerPrice : rule.dropshipperPrice;

  return {
    partnerPrice: price,
    partnerLabel: getPartnerLabel(tier),
    originalPrice: product.normal_price,
  };
}
