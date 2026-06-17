import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";
import { SITE } from "@/lib/constants";

const features = [
  {
    title: "Bahan Alami",
    description:
      "Kami memilih jamur terbaik dari petani lokal tanpa tambahan bahan pengawet yang berat.",
    icon: LeafIcon,
  },
  {
    title: "Rasa Autentik",
    description:
      "Setiap varian diracik untuk menghadirkan cita rasa gurih yang familiar dan tetap segar.",
    icon: HeartIcon,
  },
  {
    title: "Tekstur Renyah",
    description:
      "Proses pengeringan khusus menjaga kerenyahan di setiap gigitan sampai ke kemasan.",
    icon: SparkleIcon,
  },
];

const processSteps = [
  {
    title: "Seleksi Bahan",
    description:
      "Hanya jamur pilihan yang masuk ke dalam proses produksi kami setelah pemeriksaan kualitas.",
    icon: CheckIcon,
  },
  {
    title: "Pengolahan Higienis",
    description:
      "Semua tahap dilakukan di fasilitas bersih dengan standar sanitasi yang ketat.",
    icon: FactoryIcon,
  },
  {
    title: "Pewarna Alami",
    description:
      "Bumbu dan rasa menggunakan bahan alami untuk menjaga kualitas sekaligus kelezatan.",
    icon: SpoonIcon,
  },
  {
    title: "Kemasan Rapi",
    description:
      "Produk dikemas dengan rapat agar tetap segar dan mudah dinikmati kapan pun.",
    icon: PackageIcon,
  },
];

function IconWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-accent/10 text-accent">
      {children}
    </div>
  );
}

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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FactoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M3 21V9l6-3 6 3v12H3z" />
      <path d="M15 12h6v9" />
      <path d="M9 21V12" />
      <path d="M9 7V3l6 3" />
    </svg>
  );
}

function SpoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M8 3c1.1 0 2 .9 2 2 0 1.1-.9 2-2 2s-2-.9-2-2c0-1.1.9-2 2-2z" />
      <path d="M10 5l6 6-6 6" />
      <path d="M16 11l1 1 2-2" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M3 7l9-4 9 4v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <path d="M12 3v18" />
      <path d="M3 7l9 4 9-4" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: `Pelajari lebih lanjut tentang ${SITE.name}.`,
};

export default function TentangPage() {
  const whatsappLink = `https://wa.me/${SITE.phone.replace(/\D/g, "")}`;

  return (
    <>
      <Section className="bg-surface-dark">
        <PageHeader title="Tentang Kami" description={SITE.description} />

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6 text-muted">
            <p className="max-w-3xl text-lg leading-8 text-foreground/85">
              {SITE.name} lahir dari keinginan untuk membawa cita rasa jamur krispi yang sehat dan lezat ke meja keluarga Indonesia. Kami merancang setiap varian agar tetap renyah, alami, dan mudah dinikmati setiap hari.
            </p>
            <p className="max-w-3xl text-lg leading-8 text-foreground/85">
              Dari bahan baku hingga kemasan, kami menjaga standar tinggi agar setiap gigitan memberikan pengalaman rasa yang memuaskan dan autentik.
            </p>
          </div>

          <div className="rounded-4xl border border-primary/10 bg-white p-8 shadow-xl shadow-black/5">
            <div className="rounded-3xl bg-accent/5 p-6 text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-accent/90">Cita rasa kami</p>
              <h2 className="mt-4 text-3xl font-semibold text-primary">
                Camilan alami dengan rasa yang selalu membuat ketagihan.
              </h2>
            </div>
            <div className="mt-8 space-y-5">
              <div className="rounded-3xl bg-surface p-5 text-sm text-foreground/80">
                Kami percaya bahwa camilan terbaik dibuat dengan bahan alami, proses bersih, dan sentuhan kreatif yang menghormati tradisi rasa Indonesia.
              </div>
              <div className="rounded-3xl bg-surface p-5 text-sm text-foreground/80">
                Setiap produk diproses dengan hati-hati untuk memastikan kualitas, kesegaran, dan kepuasan pelanggan.
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-4xl border border-primary/10 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="mb-5">
                <IconWrapper>
                  <feature.icon />
                </IconWrapper>
              </div>
              <h3 className="text-xl font-semibold text-primary">{feature.title}</h3>
              <p className="mt-3 text-sm text-muted leading-7">{feature.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-surface-dark">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">Proses Produksi Kami</h2>
            <p className="max-w-3xl text-lg leading-8 text-muted">
              Dari pemilihan jamur hingga kemasan akhir, setiap langkah dirancang untuk menghadirkan produk yang bersih, renyah, dan penuh kualitas.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {processSteps.map((step) => (
              <div key={step.title} className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
                <div className="mb-4">
                  <IconWrapper>
                    <step.icon />
                  </IconWrapper>
                </div>
                <h3 className="font-semibold text-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-muted leading-7">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-[2.5rem] border border-secondary/15 bg-secondary/5 p-10 text-center shadow-2xl shadow-black/5 sm:p-14">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-secondary/80">Kerja sama & pemesanan</p>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
            Siap mencoba camilan jamur krispi yang otentik?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted leading-8">
            Hubungi kami untuk pemesanan, kerjasama, dan informasi produk. Kami siap membantu Anda dengan cepat dan ramah.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/kontak" variant="secondary">
              Hubungi Kami
            </Button>
            <Button
              href={whatsappLink}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary"
            >
              Chat WhatsApp
            </Button>
          </div>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 rounded-3xl bg-white/90 p-6 text-left text-sm text-foreground shadow-sm sm:text-base">
            <p>
              <span className="font-semibold text-primary">Telepon:</span> {SITE.phone}
            </p>
            <p>
              <span className="font-semibold text-primary">Email:</span> {SITE.email}
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
