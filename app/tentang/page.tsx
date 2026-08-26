import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";
import { SITE } from "@/lib/constants";

const features = [
  {
    title: "Bahan Alami",
    description:
      "Hanya jamur pilihan dari petani lokal — tanpa pengawet, tanpa pewarna buatan. Yang kamu dapat adalah rasa jamur asli yang jujur, langsung dari sumbernya.",
    icon: LeafIcon,
  },
  {
    title: "Rasa Autentik",
    description:
      "Setiap varian diracik untuk cita rasa gurih yang bikin nagih. Bukan rasa pabrik — ini rasa yang bikin kamu bilang, \"lagi, lagi, lagi.\"",
    icon: HeartIcon,
  },
  {
    title: "Tekstur Renyah",
    description:
      "Proses pengeringan khusus menjaga kerenyahan sampai ke gigitan terakhir. Buka kemasan kapan pun, rasanya tetap sama: renyah, ringan, memuaskan.",
    icon: SparkleIcon,
  },
];

const processSteps = [
  {
    step: "01",
    title: "Seleksi Bahan",
    description:
      "Setiap jamur diperiksa satu per satu. Hanya yang memenuhi standar kualitas kami yang lanjut ke tahap berikutnya.",
  },
  {
    step: "02",
    title: "Pengolahan Higienis",
    description:
      "Diproses di fasilitas bersih dengan standar sanitasi ketat — karena camilan yang enak harus juga aman untuk keluarga kamu.",
  },
  {
    step: "03",
    title: "Pewarna & Perasa Alami",
    description:
      "Bumbu dan warna sepenuhnya dari bahan alami. Tidak ada trik kimia — hanya rasa yang otentik dan bisa kamu percaya.",
  },
  {
    step: "04",
    title: "Kemasan Rapi & Segar",
    description:
      "Dikemas rapat untuk menjaga kesegaran dan kerenyahan. Siap dikirim ke mana pun, siap dinikmati kapan pun.",
  },
];

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M6 12c0-4.418 4.082-8 9-8 0 4.418-4.082 8-9 8z" />
      <path d="M15 4c0 3.314-4.582 6-10 6" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M12 21s-5.5-4.2-8.4-7.5C1.5 11 2.8 6.4 6.7 5.2c1.6-.5 3.3 0 4.3 1.3 1-1.3 2.7-1.8 4.3-1.3 3.9 1.2 5.2 5.8 2.1 8.3C17.5 16.8 12 21 12 21z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M12 2v20M2 12h20M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: `Kenali lebih dekat ${SITE.name} — camilan jamur krispi alami dari Bojonegoro, Jawa Timur.`,
};

export default function TentangPage() {
  const whatsappLink = `https://wa.me/62${SITE.phone.replace(/\D/g, "").replace(/^0/, "")}`;

  return (
    <>
      <Section className="bg-surface-dark">
        <PageHeader title="Tentang Kami" description={SITE.description} />

        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg leading-8 text-foreground/85">
            {SITE.name} lahir dari sederhana: menciptakan camilan jamur yang benar-benar enak, benar-benar alami, dan bisa dinikmati siapa saja — tanpa rasa bersalah.
          </p>
          <p className="mt-4 text-lg leading-8 text-foreground/85">
            Dari Bojonegoro, Jawa Timur, kami meramu jamur segar menjadi camilan renyah yang terasa autentik. Bukan camilan pabrik yang seragam — ini camilan yang punya cerita, punya karakter, dan yang terpenting: rasanya bikin ketagihan.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-primary/10 bg-white p-8 shadow-lg sm:p-10">
          <div className="rounded-2xl bg-accent/5 p-6 text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-accent/90">Cita rasa kami</p>
            <h2 className="mt-4 text-2xl font-bold text-primary sm:text-3xl">
              Camilan alami yang terasa jujur — dari bahan, rasa, hingga kerenyahan.
            </h2>
          </div>
          <div className="mt-6 space-y-4 text-sm text-foreground/80">
            <div className="rounded-2xl bg-surface p-5">
              Kami percaya camilan terbaik tidak perlu bahan kimia untuk terasa enak. Cukup jamur segar, bumbu alami, dan proses yang dibuat dengan hati-hati — maka hadirlah rasa yang autentik.
            </div>
            <div className="rounded-2xl bg-surface p-5">
              Setiap produk kami diproses untuk menjaga kualitas, kesegaran, dan yang paling penting — kepuasan kamu saat menikmatinya.
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-primary/10 bg-white p-8 shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <feature.icon />
              </div>
              <h3 className="text-xl font-bold text-primary">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-surface-dark">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Proses Produksi Kami
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg">
            Dari jamur segar di tangan petani hingga ke tangan kamu — setiap langkah dirancang untuk menghadirkan produk yang bersih, renyah, dan penuh kualitas.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="grid gap-5 sm:grid-cols-2">
            {processSteps.map((item) => (
              <div
                key={item.step}
                className="group rounded-3xl border border-primary/10 bg-white p-7 shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="inline-block rounded-full bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
                  Langkah {item.step}
                </span>
                <h3 className="mt-4 text-lg font-bold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-[2.5rem] border border-secondary/15 bg-secondary/5 p-10 text-center shadow-2xl shadow-black/5 sm:p-14">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-secondary/80">
            Kerja sama & pemesanan
          </p>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
            Siap mencoba camilan jamur krispi yang otentik?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted leading-8">
            Pesan langsung untuk diri sendiri, keluarga, atau mulai kerja sama bareng kami. Tim kami siap bantu dengan cepat dan ramah.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/kontak" variant="secondary">
              Hubungi Kami
            </Button>
            <Button
              href={whatsappLink}
              className="border-2 border-white bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600"
            >
              Chat WhatsApp
            </Button>
          </div>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 rounded-3xl bg-white/90 p-6 text-left text-sm text-foreground shadow-sm sm:text-base">
            <p>
              <span className="font-semibold text-primary">Telepon:</span>{" "}
              {SITE.phone}
            </p>
            <p>
              <span className="font-semibold text-primary">Email:</span>{" "}
              {SITE.email}
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
