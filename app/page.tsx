import { getBestSellers, getHomepagePromo } from "@/lib/services/product.service";
import {
  HeroSection,
  BestSellerSection,
  HomepagePromoSection,
  WhyDjaemoSection,
  TestimoniSection,
} from "@/components/home";

export const revalidate = 300;

export default async function Home() {
  const [bestSellers, promo] = await Promise.all([
    getBestSellers(3),
    getHomepagePromo(),
  ]);

  return (
    <>
      <HeroSection />

      <HomepagePromoSection
        promoName={promo?.promoName ?? ""}
        countdown={promo?.countdown ?? null}
        products={promo?.products ?? []}
      />

      <BestSellerSection products={bestSellers} />

      <WhyDjaemoSection />

      <TestimoniSection />
    </>
  );
}
