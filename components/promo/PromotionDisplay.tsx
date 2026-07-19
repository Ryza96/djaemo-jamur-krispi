import { PromoPrice } from "./PromoPrice";
import { PromoBadge } from "./PromoBadge";
import { PromoCountdown } from "./PromoCountdown";
import { PromoName } from "./PromoName";
import { PromoSectionHeader } from "./PromoSectionHeader";

export const PromotionDisplay = {
  Price: PromoPrice,
  Badge: PromoBadge,
  Countdown: PromoCountdown,
  Name: PromoName,
  SectionHeader: PromoSectionHeader,
} as const;
