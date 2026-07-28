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
      <div className="absolute inset-0 bg-gradient-to-r from-[#F8F5F1]/95 via-[#F8F5F1]/60 via-[#F8F5F1]/20 to-transparent" />
      <div className="relative z-10 mx-auto flex h-full max-w-[1280px] flex-col justify-center px-8 pb-6 xl:px-0" style={{ transform: "translateY(-32px)" }}>
        <span className="inline-block w-fit rounded-full bg-[#EDE4D3] px-4 py-1.5 text-xs font-medium text-primary">
          #1 Jamur Krispi Indonesia
        </span>
        <h1 className="mt-5 text-3xl font-extrabold leading-[1.05] tracking-tight text-foreground xl:text-[72px]">
          Renyah. Gurih.
          <br />
          Berkualitas.
        </h1>
        <div className="mt-4 h-[3px] w-12 bg-primary" />
        <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-muted">
          Camilan jamur krispi premium dengan rasa autentik Indonesia.
        </p>
        <div className="mt-4 grid max-w-[480px] grid-cols-2 gap-3 xl:grid-cols-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <b.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {b.title}
              </span>
              <span className="text-xs leading-tight text-muted">
                {b.desc}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Button
            href="/produk"
            className="min-h-[58px] bg-accent px-10 text-[15px] text-white hover:bg-accent/90"
          >
            Beli Sekarang
          </Button>
          <Button
            href="/tentang"
            variant="outline"
            className="min-h-[58px] px-10 text-[15px]"
          >
            Pelajari Selengkapnya
          </Button>
        </div>
      </div>
    </section>
  );
}
