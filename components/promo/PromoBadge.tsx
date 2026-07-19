import type { PromoBadgeProps } from "./types";

export function PromoBadge({ data, variant = "compact", className }: PromoBadgeProps) {
  if (!data.has_active_promo) return null;

  if (variant === "compact") {
    return (
      <span
        className={`inline-block rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-semibold text-white ${className ?? ""}`}
      >
        PROMO
      </span>
    );
  }

  return (
    <div className={`rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white ${className ?? ""}`}>
      <span>PROMO</span>
      {data.promo_name && (
        <span className="ml-1 opacity-90">- {data.promo_name}</span>
      )}
    </div>
  );
}
