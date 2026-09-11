import { PromoPrice } from "@/components/promo";
import type { Product } from "@/types";

interface ProductPriceDisplayProps {
  product: Product;
  variant?: "inline" | "stacked" | "detail";
  className?: string;
}

export function ProductPriceDisplay({
  product,
  variant = "inline",
  className,
}: ProductPriceDisplayProps) {
  const hasPromo = product.has_active_promo && product.promo_status !== "upcoming";
  const displayData = hasPromo
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
    : {
        has_active_promo: false as const,
        normal_price: product.normal_price,
        final_price: product.final_price,
        promo_price: null,
        discount_amount: 0,
        promo_name: null,
        promo_status: null,
        promo_countdown: null,
      };

  return (
    <div className={className}>
      <PromoPrice data={displayData} variant={variant} />
    </div>
  );
}