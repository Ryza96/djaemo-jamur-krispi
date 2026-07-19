export interface PromoDisplayData {
  has_active_promo: boolean;
  normal_price: number;
  final_price: number;
  promo_price: number | null;
  discount_amount: number;
  promo_name: string | null;
  promo_status: string | null;
  promo_countdown: {
    value: number;
    unit: "hari" | "jam" | "menit" | "detik";
    direction: "lagi" | "yang lalu";
    type: "upcoming" | "active" | "ended" | "cancelled";
    display: string;
  } | null;
}

export type PromoPriceVariant = "inline" | "stacked" | "detail";

export type PromoBadgeVariant = "compact" | "full";

export type PromoCountdownVariant = "inline" | "detail";

export interface PromoPriceProps {
  data: PromoDisplayData;
  variant?: PromoPriceVariant;
  className?: string;
}

export interface PromoBadgeProps {
  data: PromoDisplayData;
  variant?: PromoBadgeVariant;
  className?: string;
}

export interface PromoCountdownProps {
  data?: PromoDisplayData;
  countdown?: PromoDisplayData["promo_countdown"];
  variant?: PromoCountdownVariant;
  className?: string;
}

export interface PromoNameProps {
  name: string;
  className?: string;
}

export interface PromoSectionHeaderProps {
  name: string;
  countdown: PromoDisplayData["promo_countdown"];
  productCount?: number;
  className?: string;
}
