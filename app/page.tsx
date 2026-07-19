import { getCatalogProducts } from "@/lib/services/product.service";
import {
  HeroSection,
  BestSellerSection,
  MarketingBanner,
  WhyDjaemoSection,
  TestimoniSection,
} from "@/components/home";

export default async function Home() {
  const products = await getCatalogProducts();
  const activeProducts = products.filter((p) => p.stock > 0);

  return (
    <>
      <HeroSection />

      <BestSellerSection products={activeProducts} />

      <MarketingBanner />

      <WhyDjaemoSection />

      <TestimoniSection />
    </>
  );
}
