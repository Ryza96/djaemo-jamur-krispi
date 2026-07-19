import { formatPrice } from "@/lib/utils";
import type { PromoDisplayData } from "./types";

export function getDisplayPrice(data: PromoDisplayData): number {
  return data.has_active_promo ? data.final_price : data.normal_price;
}

export function formatDiscountLabel(amount: number): string {
  return `HEMAT ${formatPrice(amount)}`;
}

export function formatCountdownLabel(
  countdown: PromoDisplayData["promo_countdown"]
): string {
  if (!countdown) return "";
  return `SISA : ${countdown.value} ${countdown.unit.toUpperCase()} ${countdown.direction.toUpperCase()}`;
}

export { formatPrice };
