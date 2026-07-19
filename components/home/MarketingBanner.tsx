import Image from "next/image";
import { Section } from "@/components/sections/Section";
import { Button } from "@/components/ui/Button";

export function MarketingBanner() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-3xl">
        <div className="relative aspect-[2.5/1] w-full sm:aspect-[3/1]">
          <Image
            src="/homepage/marketing-banner/banner.webp"
            alt="Promo D'JAEMO"
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5">
          <Button
            href="/produk"
            variant="secondary"
            className="px-4 py-2 text-xs sm:px-6 sm:py-2.5 sm:text-sm"
          >
            Belanja Sekarang
          </Button>
        </div>
      </div>
    </Section>
  );
}
