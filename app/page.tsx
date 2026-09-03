import { getBestSellers, getHomepagePromo, getLowestPrice } from "@/lib/services/product.service";
import {
  HeroSection,
  BestSellerSection,
  HomepagePromoSection,
  WhyDjaemoSection,
  TestimoniSection,
  FinalCTASection,
} from "@/components/home";

export const revalidate = 300;

export default async function Home() {
  const [bestSellers, promo, lowestPrice] = await Promise.all([
    getBestSellers(3),
    getHomepagePromo(),
    getLowestPrice(),
  ]);

  return (
    <>
      <HeroSection initialPrice={lowestPrice} />

      <BestSellerSection products={bestSellers} />

      <HomepagePromoSection
        promoName={promo?.promoName ?? ""}
        countdown={promo?.countdown ?? null}
        products={promo?.products ?? []}
      />

      <WhyDjaemoSection />

      <TestimoniSection />

      <FinalCTASection />
    </>
  );
}
