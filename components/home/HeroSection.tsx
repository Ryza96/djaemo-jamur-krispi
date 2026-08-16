import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Leaf, ShieldCheck, Truck, Star } from "lucide-react";

const HERO_HEIGHT = 560;

const benefits = [
  { icon: Leaf, title: "Alami", desc: "Tanpa pengawet" },
  { icon: ShieldCheck, title: "Premium", desc: "Kualitas terjamin" },
  { icon: Truck, title: "Cepat", desc: "Kirim Indonesia" },
  { icon: Star, title: "Autentik", desc: "Resep temurun" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ height: HERO_HEIGHT }}>
      <Image
        src="/homepage/hero/hero-desktop.webp"
        alt="D'JAEMO Jamur Krispi"
        fill
        className="object-cover object-[55%_center]"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-teal-deep/95 via-teal-deep/75 via-teal-mid/45 to-teal-deep/10" />
      <div className="relative z-10 mx-auto flex h-full max-w-[1280px] flex-col justify-center px-8 pb-6 xl:px-0" style={{ transform: "translateY(-32px)" }}>
        <span className="inline-block w-fit rounded-full border border-gold/40 bg-white/10 px-4 py-1.5 text-xs font-medium text-gold-bright">
          #1 Jamur Krispi Indonesia
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold leading-[1.05] tracking-tight text-cream xl:text-[72px]">
          Renyah. Gurih.
          <br />
          Berkualitas.
        </h1>
        <div className="mt-4 h-[3px] w-12 bg-gold" />
        <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-cream/80">
          Camilan jamur krispi premium dengan rasa autentik Indonesia.
        </p>
        <div className="mt-4 grid max-w-[480px] grid-cols-2 gap-3 xl:grid-cols-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-white/5">
                <b.icon className="h-5 w-5 text-gold-bright" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold text-cream">
                {b.title}
              </span>
              <span className="text-xs leading-tight text-cream/70">
                {b.desc}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Button
            href="/produk"
            className="min-h-[58px] bg-red px-10 text-[15px] text-white hover:bg-red/90"
          >
            Beli Sekarang
          </Button>
          <Button
            href="/tentang"
            variant="outline"
            className="min-h-[58px] border-cream px-10 text-[15px] text-cream hover:bg-cream hover:text-ink"
          >
            Pelajari Selengkapnya
          </Button>
        </div>
      </div>
    </section>
  );
}
