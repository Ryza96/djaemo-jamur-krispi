"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/sections/Section";
import { products } from "@/data/products";
import { SITE } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export default function Home() {
  const featured = products.slice(0, 3);
  const carouselImages = useMemo(
    () => [
      "/images/hero/balado.png",
      "/images/hero/bbq.png",
      "/images/hero/pedasmanis.png",
    ],
    [],
  );
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const activeCarouselImage = carouselImages[activeCarouselIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCarouselIndex((current) => (current + 1) % carouselImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  return (
    <>
      <section className="relative overflow-hidden text-white min-h-128 sm:min-h-144">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-110 contrast-110"
            style={{ backgroundImage: "url('/images/hero/hero.jpg')" }}
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/75 backdrop-blur-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                Delapan Cakra Indonesia
              </div>
              <div>
                <Image
                  src={SITE.logo}
                  alt={`Logo ${SITE.name}`}
                  width={120}
                  height={120}
                  priority
                  className="mb-6 h-24 w-24 object-contain sm:h-28 sm:w-28"
                />
                <p className="text-sm font-medium uppercase tracking-widest text-secondary-light">
                  Camilan Alami
                </p>
                <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
                  {SITE.name}
                </h1>
                <p className="mt-4 max-w-xl text-lg text-white/80 sm:text-xl">
                  Real Mushroom, Real Crunch
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button href="/produk" variant="secondary">
                  Lihat Produk
                </Button>
                <Button
                  href="/tentang"
                  variant="outline"
                  className="border-white text-white hover:bg-[#dbc81a]! hover:text-black!"
                >
                  Tentang Kami
                </Button>
              </div>
            </div>

            <div className="rounded-4xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-md">
              <div className="overflow-hidden rounded-3xl border border-white/10">
                <div className="h-72 bg-cover bg-center sm:h-96 md:h-112" style={{ backgroundImage: `url('${activeCarouselImage}')` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">
            Produk Unggulan
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Tiga varian favorit pelanggan kami — renyah, gurih, dan penuh rasa.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm"
            >
              <div className="relative overflow-hidden rounded-t-2xl">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={480}
                  height={320}
                  className="h-48 w-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-primary">{product.name}</h3>
                <p className="mt-1 text-sm text-muted line-clamp-2">
                  {product.description}
                </p>
                <p className="mt-3 text-lg font-bold text-secondary">
                  {formatPrice(product.price)}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button href="/produk" variant="outline">
            Lihat Semua Produk
          </Button>
        </div>
      </Section>

      <Section className="bg-surface-dark">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">
              Kenapa Pilih Kami?
            </h2>
            <ul className="mt-6 space-y-4 text-muted">
              <li className="flex gap-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                Bahan jamur alami berkualitas tinggi
              </li>
              <li className="flex gap-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                Tekstur renyah di setiap kemasan
              </li>
              <li className="flex gap-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                Varian rasa untuk selera Indonesia
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-primary">
              Siap memesan?
            </p>
            <p className="mt-2 text-sm text-muted">
              Hubungi kami via WhatsApp untuk pemesanan cepat.
            </p>
            <Button href="/kontak" className="mt-6">
              Hubungi Kami
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
