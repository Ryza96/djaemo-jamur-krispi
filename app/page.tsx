import { getCatalogProducts } from "@/lib/services/product.service";
import {
  HeroSection,
  BestSellerSection,
  MarketingBanner,
  BestSellerPromoLayout,
  WhyDjaemoSection,
  TestimoniSection,
} from "@/components/home";

export default async function Home() {
  const products = await getCatalogProducts();
  const activeProducts = products.filter((p) => p.stock > 0);

  return (
    <>
      <HeroSection />

      <BestSellerPromoLayout
        bestSeller={<BestSellerSection products={activeProducts} embedded />}
        promo={<MarketingBanner />}
      />

      <WhyDjaemoSection />

      <TestimoniSection />
    </>
  );
}
