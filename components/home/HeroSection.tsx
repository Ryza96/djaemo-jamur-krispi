import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="w-full bg-white">
      {/* Desktop + Laptop: side by side */}
      <div className="hidden md:flex md:items-center md:gap-8 md:px-8 md:py-8 lg:gap-12 lg:px-12 lg:py-10">
        <div className="flex-shrink-0 max-w-sm lg:max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-gray-900 lg:text-4xl">
            Renyah. Gurih.<br />Berkualitas.
          </h1>
          <p className="mt-3 text-base text-gray-600 lg:text-lg">
            Camilan jamur krispi premium dengan rasa autentik Indonesia.
          </p>
          <div className="mt-5">
            <Button href="/produk" variant="secondary" className="px-6 py-2.5 text-sm sm:px-8 sm:py-3 sm:text-base">
              Beli Sekarang
            </Button>
          </div>
        </div>
        <div className="relative flex-1">
          <Image
            src="/homepage/hero/hero.webp"
            alt="D'JAEMO Jamur Krispi"
            width={1920}
            height={1080}
            className="h-auto w-full"
            sizes="(min-width: 768px) 55vw, 100vw"
            priority
          />
        </div>
      </div>

      {/* Mobile + Tablet: stacked */}
      <div className="md:hidden">
        {/* Mobile: product first */}
        <div className="block sm:hidden">
          <div className="relative w-full">
            <Image
              src="/homepage/hero/hero.webp"
              alt="D'JAEMO Jamur Krispi"
              width={1920}
              height={1080}
              className="h-auto w-full"
              sizes="100vw"
              priority
            />
          </div>
          <div className="px-5 py-6">
            <h1 className="text-2xl font-bold leading-tight text-gray-900">
              Renyah. Gurih.<br />Berkualitas.
            </h1>
            <p className="mt-3 text-base text-gray-600">
              Camilan jamur krispi premium dengan rasa autentik Indonesia.
            </p>
            <div className="mt-5">
              <Button href="/produk" variant="secondary" className="px-6 py-2.5 text-sm">
                Beli Sekarang
              </Button>
            </div>
          </div>
        </div>

        {/* Tablet: text first */}
        <div className="hidden sm:block md:hidden">
          <div className="px-6 py-6">
            <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
              Renyah. Gurih.<br />Berkualitas.
            </h1>
            <p className="mt-3 text-base text-gray-600 sm:text-lg">
              Camilan jamur krispi premium dengan rasa autentik Indonesia.
            </p>
            <div className="mt-5">
              <Button href="/produk" variant="secondary" className="px-6 py-2.5 text-sm sm:px-8 sm:py-3 sm:text-base">
                Beli Sekarang
              </Button>
            </div>
          </div>
          <div className="relative w-full">
            <Image
              src="/homepage/hero/hero.webp"
              alt="D'JAEMO Jamur Krispi"
              width={1920}
              height={1080}
              className="h-auto w-full"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
