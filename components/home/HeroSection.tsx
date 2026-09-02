import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M6.27 3.46a3 3 0 0 1 1.75-.72 3 3 0 0 1 3.97 0 3 3 0 0 1 1.75.72 3 3 0 0 1 2.81 2.81c.05.64.3 1.25.72 1.75a3 3 0 0 1 0 3.97 3 3 0 0 1-.72 1.75 3 3 0 0 1-2.81 2.81 3 3 0 0 1-1.75.72 3 3 0 0 1-3.97 0 3 3 0 0 1-1.75-.72 3 3 0 0 1-2.81-2.81 3 3 0 0 1-.72-1.75 3 3 0 0 1 0-3.97 3 3 0 0 1 .72-1.75 3 3 0 0 1 2.81-2.81zM13 9a1 1 0 1 0-1.4-1.4L9 10.2l-1.6-1.6a1 1 0 0 0-1.4 1.4l2.3 2.3a1 1 0 0 0 1.4 0l3-3z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 5V2l-5 7h3v5l4-5h-3z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M2 6h16a1 1 0 0 1 .9 1.4l-2 4A1 1 0 0 1 16 12H8v4H6v-9H2a1 1 0 0 1 0-2zM3 15h6v2H3z" />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-teal-deep pt-5 pb-16 md:pt-6 md:pb-[72px] lg:pt-5 lg:pb-[84px]">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* Text */}
        <div className="flex flex-col items-start gap-6 md:gap-7">
          <div className="flex flex-col gap-4">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-gold">
              Camilan jamur premium di Bojonegoro
            </p>
            <h1 className="font-display text-[40px] font-semibold leading-[1.08] tracking-tight text-cream md:text-[60px] lg:text-[64px]">
              Renyah. Gurih.
              <br />
              <em className="not-italic text-gold-bright">Berkualitas.</em>
            </h1>
          </div>

          <p className="max-w-md text-base leading-relaxed text-cream/70 md:text-lg">
            Jamur krispi dari bahan alami pilihan, digoreng fresh setiap hari dengan
            rasa autentik Indonesia yang bikin ketagihan.
          </p>

          <div className="w-full max-w-[430px] rounded-2xl border border-gold/25 bg-white/5 px-5 py-4">
            <div>
              <span className="block text-xs text-cream/60">Harga mulai</span>
              <span className="mt-1 block font-mono text-xl font-semibold text-gold-bright">
                Rp 22.000
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <Button
              href="/produk"
              className="rounded-lg bg-gold px-10 py-3.5 text-[15px] font-semibold text-teal-deep shadow-lg shadow-gold/20 hover:bg-gold-bright"
            >
              Beli Sekarang
            </Button>
            <Link
              href="/tentang"
              className="text-sm font-semibold text-cream/70 underline decoration-gold/40 underline-offset-4 transition-colors hover:text-cream hover:decoration-gold md:text-[15px]"
            >
              Pelajari Selengkapnya
            </Link>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3 text-cream/65">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-gold"><CheckIcon /></span>
              100% Alami
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-gold"><BoltIcon /></span>
              Fresh &amp; Higienis
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-gold"><TruckIcon /></span>
              Kirim Aman
            </div>
          </div>
        </div>

        {/* Visual */}
        <div className="relative flex items-center justify-center">
          <div className="pointer-events-none absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(227,179,61,0.30),rgba(227,179,61,0.05)_62%,transparent_72%)]" />
          <div className="relative aspect-square w-full max-w-[520px]">
            <div className="absolute inset-0 rounded-[28%] border border-gold/20 bg-gradient-to-br from-[#f7e9c8] via-[#eac678] to-[#d9b25f] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.2)]" />
            <Image
              src="/images/hero/balado.webp"
              alt="D'JAEMO Jamur Krispi"
              fill
              className="relative z-10 object-contain p-6 drop-shadow-[0_24px_60px_rgba(0,0,0,0.4)]"
              priority
              sizes="(max-width: 1024px) 100vw, 520px"
            />

            <div className="absolute right-0 top-[8%] z-20 flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2 shadow-xl backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <div>
                <p className="font-mono text-xs font-semibold text-teal-deep">Digoreng Fresh</p>
                <p className="text-[11px] text-ink-soft">setiap hari</p>
              </div>
            </div>

            <div className="absolute bottom-[10%] left-0 z-20 flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2 shadow-xl backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-red" />
              <div>
                <p className="font-mono text-xs font-semibold text-teal-deep">Promo -14%</p>
                <p className="text-[11px] text-ink-soft">Bundle 3 varian</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
