import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";

const BENEFITS = [
  "Semua varian favorit",
  "Lebih hemat daripada beli satuan",
];

export function MarketingBanner() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-cream via-cream-2 to-cream-2 shadow-sm ring-1 ring-gold/15">
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap gap-2">
          <span className="inline-block w-fit rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-gold">
            Promo Spesial
          </span>
          <span className="inline-block w-fit rounded-full border border-red/20 bg-red/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-red">
            Hemat 14%
          </span>
        </div>

        <h3 className="mt-4 font-display text-xl font-semibold leading-tight tracking-tight text-ink sm:text-2xl">
          Bundle 3 Varian
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Lebih hemat dibanding membeli satuan.
        </p>

        <ul className="mt-4 space-y-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-ink">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red/10">
                <Check className="h-3 w-3 text-red" strokeWidth={2.5} />
              </div>
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-mono text-2xl font-bold text-ink">Rp 89.000</span>
          <span className="text-sm text-ink-soft line-through">Rp 105.000</span>
        </div>

        <div className="mt-5">
          <Button
            href="/produk"
            className="min-h-[56px] bg-red px-8 text-sm font-semibold text-white hover:bg-red/90"
          >
            Lihat Bundle
          </Button>
        </div>
      </div>

      <div className="relative flex h-[180px] items-center justify-center overflow-hidden sm:h-[200px]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#F0E4CE]/60 to-transparent" />
        <div className="relative flex items-end justify-center">
          <div className="relative h-[130px] w-[130px] sm:h-[150px] sm:w-[150px]">
            <Image
              src="/images/hero/balado.webp"
              alt="D'JAEMO Balado"
              fill
              className="object-contain drop-shadow-lg"
              sizes="150px"
            />
          </div>
          <div className="relative -ml-6 h-[140px] w-[140px] sm:-ml-8 sm:h-[160px] sm:w-[160px]">
            <Image
              src="/images/hero/pedasmanis.webp"
              alt="D'JAEMO Pedas Manis"
              fill
              className="object-contain drop-shadow-xl"
              sizes="160px"
            />
          </div>
          <div className="relative -ml-6 h-[120px] w-[120px] sm:-ml-8 sm:h-[140px] sm:w-[140px]">
            <Image
              src="/images/hero/bbq.webp"
              alt="D'JAEMO BBQ"
              fill
              className="object-contain drop-shadow-lg"
              sizes="140px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
