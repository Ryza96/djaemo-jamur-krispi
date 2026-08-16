import type { PromoPriceProps } from "./types";
import { formatPrice, getDisplayPrice, formatDiscountLabel } from "./utils";

export function PromoPrice({ data, variant = "inline", className }: PromoPriceProps) {
  if (!data.has_active_promo) {
    return (
      <p className={`font-mono text-2xl font-bold text-ink sm:text-3xl ${className ?? ""}`}>
        {formatPrice(data.normal_price)}
      </p>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`space-y-1 ${className ?? ""}`}>
        <p className="text-sm text-ink-soft line-through">
          {formatPrice(data.normal_price)}
        </p>
        <p className="font-mono text-xl font-bold text-ink">
          {formatPrice(data.final_price)}
        </p>
        <p className="text-sm font-medium text-red">
          {formatDiscountLabel(data.discount_amount)}
        </p>
      </div>
    );
  }

  if (variant === "stacked") {
    return (
      <div className={`${className ?? ""}`}>
        <p className="font-mono text-2xl font-bold text-ink sm:text-3xl">
          {formatPrice(data.final_price)}
        </p>
      </div>
    );
  }

  return (
    <div className={`${className ?? ""}`}>
      <p className="text-sm text-ink-soft line-through">
        {formatPrice(data.normal_price)}
      </p>
      <p className="font-mono text-3xl font-bold text-ink sm:text-4xl">
        {formatPrice(data.final_price)}
      </p>
      <p className="mt-1 text-sm font-medium text-red">
        {formatDiscountLabel(data.discount_amount)}
      </p>
    </div>
  );
}
