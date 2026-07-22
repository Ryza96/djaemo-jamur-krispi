"use client";

import { useContext } from "react";
import { PartnerAuthContext } from "./PartnerAuthProvider";
import { resolvePartnerPrice } from "@/lib/partner/pricing";
import { PromoPrice, PromoBadge } from "@/components/promo";
import type { Product } from "@/types";

interface PartnerPriceDisplayProps {
  product: Product;
  variant?: "inline" | "stacked" | "detail";
  className?: string;
}

export function PartnerPriceDisplay({
  product,
  variant = "inline",
  className,
}: PartnerPriceDisplayProps) {
  const ctx = useContext(PartnerAuthContext);
  const { partnerPrice, partnerLabel, originalPrice } = resolvePartnerPrice(
    product,
    ctx?.partner?.status ?? null,
  );

  const hasPromo = product.has_active_promo && product.promo_status !== "upcoming";
  const promoData = hasPromo
    ? {
        has_active_promo: true as const,
        normal_price: product.normal_price,
        final_price: product.final_price,
        promo_price: product.promo_price,
        discount_amount: product.discount_amount,
        promo_name: product.promo_name,
        promo_status: product.promo_status,
        promo_countdown: product.promo_countdown,
      }
    : null;

  const basePrice = promoData ?? {
    has_active_promo: false as const,
    normal_price: product.normal_price,
    final_price: product.final_price,
    promo_price: null,
    discount_amount: 0,
    promo_name: null,
    promo_status: null,
    promo_countdown: null,
  };

  const displayData = partnerPrice !== null
    ? { ...basePrice, normal_price: partnerPrice, final_price: partnerPrice }
    : basePrice;

  return (
    <div className={className}>
      {partnerLabel && (
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-block rounded-full bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent">
            {partnerLabel}
          </span>
          {promoData && (
            <PromoBadge data={promoData} variant="compact" />
          )}
        </div>
      )}

      <PromoPrice data={displayData} variant={variant} />

      {partnerLabel && promoData && (
        <p className="mt-1 text-xs text-muted line-through">
          Harga Normal: Rp {originalPrice.toLocaleString("id-ID")}
        </p>
      )}
    </div>
  );
}
