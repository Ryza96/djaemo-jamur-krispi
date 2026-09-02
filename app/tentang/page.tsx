import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/sections/Section";
import { SITE } from "@/lib/constants";

const values = [
  {
    title: "Bahan Pilihan",
    description: "Jamur segar pilihan, tanpa pengawet dan pewarna buatan.",
    icon: LeafIcon,
  },
  {
    title: "Rasa Autentik",
    description: "Diracik untuk cita rasa Indonesia yang gurih dan nagih.",
    icon: HeartIcon,
  },
  {
    title: "Fresh Setiap Hari",
    description: "Digoreng fresh setiap hari agar renyah sampai di tanganmu.",
    icon: SparkleIcon,
  },
  {
    title: "Kualitas & Kebersihan",
    description: "Diproses dengan standar sanitasi ketat agar aman untuk keluarga.",
    icon: BoxIcon,
  },
];

const processSteps = [
  {
    step: "01",
    title: "Pilih Bahan",
    description: "Jamur segar pilihan diperiksa satu per satu sebelum masuk ke proses.",
  },
  {
    step: "02",
    title: "Olah dengan Teliti",
    description: "Diproses di tempat bersih dengan bumbu alami, tanpa trik kimia.",
  },
  {
    step: "03",
    title: "Goreng Fresh",
    description: "Digoreng fresh setiap hari agar kerenyahan terjaga sampai gigitan terakhir.",
  },
  {
    step: "04",
    title: "Kemas & Kirim",
    description: "Dikemas rapat menjaga kesegaran, lalu dikirim aman sampai tujuan.",
  },
];

const reasons = [
  {
    title: "100% Alami",
    description: "Tanpa pengawet dan pewarna buatan — rasa jujur dari jamur asli.",
    icon: AwardIcon,
  },
  {
    title: "Fresh & Higienis",
    description: "Diproses di lingkungan bersih dan digoreng fresh setiap hari.",
    icon: BoltIcon,
  },
  {
    title: "Rasa Autentik",
    description: "Diracik khusus untuk lidah Indonesia — gurih, hangat, dan nagih.",
    icon: StarIcon,
  },
  {
    title: "Kemasan Rapi",
    description: "Dikemas rapat menjaga kesegaran dan kerenyahan sampai ke tanganmu.",
    icon: TruckIcon,
  },
];

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 12c0-4.418 4.082-8 9-8 0 4.418-4.082 8-9 8z" />
      <path d="M15 4c0 3.314-4.582 6-10 6" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s-5.5-4.2-8.4-7.5C1.5 11 2.8 6.4 6.7 5.2c1.6-.5 3.3 0 4.3 1.3 1-1.3 2.7-1.8 4.3-1.3 3.9 1.2 5.2 5.8 2.1 8.3C17.5 16.8 12 21 12 21z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 2v20M2 12h20M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.27 6.96 8.73 5.05 8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M6.27 3.46a3 3 0 0 1 1.75-.72 3 3 0 0 1 3.97 0 3 3 0 0 1 1.75.72 3 3 0 0 1 2.81 2.81c.05.64.3 1.25.72 1.75a3 3 0 0 1 0 3.97 3 3 0 0 1-.72 1.75 3 3 0 0 1-2.81 2.81 3 3 0 0 1-1.75.72 3 3 0 0 1-3.97 0 3 3 0 0 1-1.75-.72 3 3 0 0 1-2.81-2.81 3 3 0 0 1-.72-1.75 3 3 0 0 1 0-3.97 3 3 0 0 1 .72-1.75 3 3 0 0 1 2.81-2.81zM13 9a1 1 0 1 0-1.4-1.4L9 10.2l-1.6-1.6a1 1 0 0 0-1.4 1.4l2.3 2.3a1 1 0 0 0 1.4 0l3-3z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 5V2l-5 7h3v5l4-5h-3z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 0 0 .95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 0 0-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 0 0-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 0 0-.36-1.12L3.53 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 0 0 .95-.69l1.07-3.29z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M2 6h16a1 1 0 0 1 .9 1.4l-2 4A1 1 0 0 1 16 12H8v4H6v-9H2a1 1 0 0 1 0-2zM3 15h6v2H3z" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: `Kenali lebih dekat ${SITE.name} — camilan jamur krispi alami dari Bojonegoro, Jawa Timur.`,
};

export default function TentangPage() {
  return (
    <>
      {/* 1 · HERO TENTANG — hijau gelap, sesuai desain yang disetujui */}
      <section className="relative bg-teal-deep px-4 pt-12 pb-16 text-cream sm:px-6 md:pt-14 md:pb-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-gold">
              Tentang D&apos;Jaemo
            </p>
            <h1 className="mt-4 font-display text-[40px] font-semibold leading-[1.08] tracking-tight text-cream md:text-[52px] lg:text-[60px]">
              Renyahnya D&apos;Jaemo,
              <br />
              <em className="not-italic text-gold-bright">Cerita di Baliknya.</em>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/70 md:text-lg">
              D&apos;Jaemo adalah camilan jamur krispi yang dibuat dari bahan alami
              pilihan dengan cita rasa Indonesia. Digoreng fresh setiap hari,
              dikemas rapi, dan dikirim aman sampai tujuan.
            </p>
            <div className="mt-6 hidden flex-wrap gap-2.5 md:flex">
              <span className="rounded-full border border-gold/25 bg-white/5 px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-widest text-cream/85">
                Bahan alami pilihan
              </span>
              <span className="rounded-full border border-gold/25 bg-white/5 px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-widest text-cream/85">
                Digoreng fresh
              </span>
              <span className="rounded-full border border-gold/25 bg-white/5 px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-widest text-cream/85">
                Bojonegoro, Jawa Timur
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-gold/35 shadow-[0_16px_40px_-12px_rgba(18,31,29,0.35)]">
              <Image
                unoptimized={process.env.NODE_ENV === "development"}
                src="/images/produk/PEDAS MANIS.webp"
                alt="D'Jaemo Jamur Krispi"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 520px"
              />
            </div>
            <div className="absolute left-[-10px] top-4 hidden items-center gap-2.5 rounded-xl bg-cream/95 px-3.5 py-2.5 shadow-lg backdrop-blur md:flex">
              <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />
              <div>
                <p className="font-mono text-xs font-semibold text-teal-deep">100% Alami</p>
                <p className="text-xs text-ink-soft">tanpa pengawet</p>
              </div>
            </div>
            <div className="absolute bottom-4 right-[-10px] hidden items-center gap-2.5 rounded-xl bg-cream/95 px-3.5 py-2.5 shadow-lg backdrop-blur md:flex">
              <span className="h-2 w-2 shrink-0 rounded-full bg-gold-bright" />
              <div>
                <p className="font-mono text-xs font-semibold text-teal-deep">Fresh Setiap Hari</p>
                <p className="text-xs text-ink-soft">digoreng saat pesanan</p>
              </div>
            </div>
            <span className="absolute bottom-3 left-3 rounded-md bg-teal-deep/85 px-2.5 py-1.5 font-mono text-xs uppercase tracking-wider text-cream md:hidden">
              100% Alami
            </span>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
      </section>

      {/* 2 · CERITA */}
      <Section>
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-[60px]">
          <div>
            <p className="font-mono text-sm font-medium uppercase tracking-widest text-teal-mid">
              Cerita Kami
            </p>
            <h2 className="mt-4 font-display text-[32px] font-semibold leading-[1.15] tracking-tight text-ink md:text-[38px]">
              Berawal dari Satu Gigitan.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft md:text-lg md:leading-[1.75]">
              Semua berawal dari satu gigitan — angan sederhana untuk menghadirkan
              camilan jamur yang benar-benar enak, benar-benar alami, dan bisa
              dinikmati siapa saja tanpa rasa bersalah. Dari dapur kecil di
              Bojonegoro, Jawa Timur, D&apos;Jaemo lahir dengan satu fokus: jamur
              krispi.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft md:text-lg md:leading-[1.75]">
              Kami memilih jamur segar dengan penuh perhatian, meracik bumbu khas
              Indonesia, dan mengolahnya dengan teliti. Tujuannya sederhana —
              camilan berkualitas yang rasanya jujur, dari bahan sampai kerenyahan.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-5 border-t border-cream-2 pt-6">
              <div>
                <p className="font-mono text-xl font-semibold text-teal-deep">Bojonegoro</p>
                <p className="mt-0.5 text-xs text-ink-soft/70">asal D&apos;Jaemo, Jawa Timur</p>
              </div>
              <div>
                <p className="font-mono text-xl font-semibold text-teal-deep">100% Alami</p>
                <p className="mt-0.5 text-xs text-ink-soft/70">tanpa pengawet &amp; pewarna buatan</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-cream-2 shadow-[0_6px_20px_-6px_rgba(18,31,29,0.16)]">
              <Image
                unoptimized={process.env.NODE_ENV === "development"}
                src="/images/produk/BALADO.webp"
                alt="D'Jaemo Jamur Krispi Balado"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 560px"
              />
              <span className="absolute bottom-3.5 left-3.5 hidden rounded-md bg-teal-deep/85 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-cream md:block">
                Jamur krispi · hasil olahan fresh
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* 3 · NILAI / PRINSIP */}
      <Section className="bg-teal-deep">
        <div className="text-center">
          <p className="font-mono text-sm font-medium uppercase tracking-widest text-gold-bright">
            Nilai Kami
          </p>
          <h2 className="mt-4 font-display text-[30px] font-semibold leading-[1.15] tracking-tight text-cream md:text-[38px]">
            Apa yang Kami Pegang?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-cream/70">
            Prinsip yang selalu kami jaga dari memilih bahan hingga sampai ke tanganmu.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-[980px] grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-[22px]">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-xl border border-gold/20 bg-white/5 px-4 py-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/10"
            >
              <div className="mx-auto mb-4 flex h-[50px] w-[50px] items-center justify-center rounded-[14px] border border-gold/30 bg-gold/15 text-gold-bright">
                <value.icon />
              </div>
              <h3 className="text-sm font-semibold text-cream md:text-base">{value.title}</h3>
              <p className="mt-1.5 text-xs leading-snug text-cream/75 md:text-sm md:leading-snug md:text-cream/75">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 4 · PROSES PEMBUATAN */}
      <Section className="bg-cream-2">
        <div className="text-center">
          <p className="font-mono text-sm font-medium uppercase tracking-widest text-teal-mid">
            Proses Pembuatan
          </p>
          <h2 className="mt-4 font-display text-[32px] font-semibold leading-[1.15] tracking-tight text-ink md:text-[38px]">
            Dibuat dengan Perhatian.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-ink-soft">
            Bukan sekadar digoreng — setiap langkah dijaga agar hasilnya renyah, bersih, dan memuaskan.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-[1040px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[22px]">
          {processSteps.map((item, index) => (
            <div
              key={item.step}
              className="relative flex items-start gap-3.5 sm:block sm:rounded-xl sm:border sm:border-cream-2 sm:bg-white sm:p-5 sm:shadow-sm sm:transition-all sm:duration-200 sm:hover:-translate-y-1 sm:hover:shadow-md"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold font-mono text-xs font-semibold text-[#2b220d] sm:h-auto sm:w-auto sm:rounded-full sm:px-2.5 sm:py-1">
                {item.step}
              </span>
              <div className="pt-0.5 sm:pt-0">
                <h3 className="text-sm font-semibold text-ink sm:mt-3 sm:text-base">{item.title}</h3>
                <p className="mt-0.5 text-sm leading-snug text-ink-soft sm:mt-1.5 sm:text-base sm:leading-relaxed">
                  {item.description}
                </p>
              </div>
              {index < processSteps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-[-20px] left-[19px] top-10 w-px bg-cream-2 sm:hidden"
                />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* 5 · KENAPA D'JAEMO */}
      <Section>
        <div className="text-center">
          <p className="font-mono text-sm font-medium uppercase tracking-widest text-teal-mid">
            Keunggulan Kami
          </p>
          <h2 className="mt-4 font-display text-[32px] font-semibold leading-[1.15] tracking-tight text-ink md:text-[38px]">
            Kenapa D&apos;Jaemo?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-ink-soft">
            Alasan pelanggan memilih jamur krispi alami yang dibuat dengan hati-hati.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-[880px] grid-cols-1 gap-4 md:grid-cols-2 md:gap-[18px]">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="flex items-start gap-3.5 rounded-xl border border-cream-2 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md md:p-[22px]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/15 text-[#2b220d]">
                <reason.icon />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink md:text-base">{reason.title}</h3>
                <p className="mt-1 text-sm leading-snug text-ink-soft md:text-base md:leading-relaxed">
                  {reason.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 6 · CTA */}
      <section className="bg-teal-deep px-6 pb-16 pt-16 text-center text-cream md:pb-[84px] md:pt-[84px]">
        <div className="mx-auto max-w-[680px]">
          <p className="font-mono text-sm font-medium uppercase tracking-widest text-gold">
            Coba Sekarang
          </p>
          <h2 className="mt-4 font-display text-[30px] font-semibold leading-[1.15] tracking-tight text-cream md:text-[40px]">
            Sudah Siap Coba <em className="not-italic text-gold-bright">D&apos;Jaemo?</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-base leading-relaxed text-cream/75">
            Pilih varian jamur krispi favoritmu dan rasakan sendiri — dibuat fresh,
            dikirim aman, dan dijamin bikin ketagihan.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Button
              href="/produk"
              className="w-full rounded-lg bg-gold px-10 py-3.5 text-sm font-semibold text-teal-deep shadow-lg shadow-gold/20 hover:bg-gold-bright sm:w-auto"
            >
              Beli Sekarang
            </Button>
            <Button
              variant="outline"
              href="/produk"
              className="w-full rounded-lg border-cream/40 px-10 py-3.5 text-sm font-semibold text-cream hover:bg-cream hover:text-teal-deep sm:w-auto"
            >
              Lihat Produk
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}