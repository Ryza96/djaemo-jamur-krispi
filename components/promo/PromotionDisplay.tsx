import { PromoPrice } from "./PromoPrice";
import { PromoBadge } from "./PromoBadge";
import { PromoCountdown } from "./PromoCountdown";
import { PromoName } from "./PromoName";
import { PromoSectionHeader } from "./PromoSectionHeader";
import { PartnerPriceDisplay } from "@/components/partner/PartnerPriceDisplay";

export const PromotionDisplay = {
  Price: PromoPrice,
  PartnerPrice: PartnerPriceDisplay,
  Badge: PromoBadge,
  Countdown: PromoCountdown,
  Name: PromoName,
  SectionHeader: PromoSectionHeader,
} as const;
