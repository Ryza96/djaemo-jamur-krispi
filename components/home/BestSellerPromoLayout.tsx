import { Section } from "@/components/sections/Section";

interface BestSellerPromoLayoutProps {
  bestSeller: React.ReactNode;
  promo: React.ReactNode;
}

export function BestSellerPromoLayout({
  bestSeller,
  promo,
}: BestSellerPromoLayoutProps) {
  return (
    <Section className="-mt-8">
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div>{bestSeller}</div>
        <div>{promo}</div>
      </div>
    </Section>
  );
}
