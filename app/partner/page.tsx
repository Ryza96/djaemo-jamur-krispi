import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { PageHeader, Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "Menjadi Partner",
  description: `Program Kemitraan Resmi ${SITE.name} sebagai Reseller atau Dropshipper.`,
};

const partnerTypes = [
  {
    title: "Reseller",
    description:
      "Reseller merupakan Partner yang membeli produk D'JAEMO dalam jumlah tertentu dan mendistribusikannya melalui saluran penjualan milik sendiri, baik toko fisik maupun toko online.",
    requirements: [
      "Memiliki toko offline atau online",
      "Registrasi Partner",
      "Approval oleh Admin",
    ],
    icon: StoreIcon,
    href: "/partner/reseller",
  },
  {
    title: "Dropshipper",
    description:
      "Dropshipper merupakan Partner yang dapat memasarkan produk D'JAEMO tanpa perlu menyediakan stok produk sendiri. Pesanan dari pelanggan akan dikirimkan langsung oleh D'JAEMO atas nama Partner.",
    requirements: [
      "Registrasi Partner",
      "Menjelaskan bagaimana akan menjual produk",
      "Approval oleh Admin",
    ],
    icon: TruckIcon,
    href: "/partner/dropshipper",
  },
];

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9" />
      <path d="M9 21V14h6v7" />
      <path d="M3 9c0 1.1.9 2 2 2s2-.9 2-2" />
      <path d="M7 9c0 1.1.9 2 2 2s2-.9 2-2" />
      <path d="M11 9c0 1.1.9 2 2 2s2-.9 2-2" />
      <path d="M15 9c0 1.1.9 2 2 2s2-.9 2-2" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-accent">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PartnerPage() {
  return (
    <>
      <Section className="bg-cream-2">
        <PageHeader
          title="Menjadi Partner"
          description="Program Kemitraan Resmi D'JAEMO."
        />

        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg leading-8 text-muted">
            Program Kemitraan Resmi D&apos;JAEMO membuka kesempatan bagi individu atau bisnis
            yang ingin menjadi Partner resmi dalam mendistribusikan produk D&apos;JAEMO.
            Pilih model kemitraan yang paling sesuai dengan Anda.
          </p>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 md:grid-cols-2">
          {partnerTypes.map((partner) => (
            <div
              key={partner.title}
              className="rounded-4xl border border-ink/10 bg-white p-8 shadow-sm sm:p-10"
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-deep/10 text-teal-deep">
                <partner.icon />
              </div>

              <h2 className="text-2xl font-bold text-ink">{partner.title}</h2>
              <p className="mt-4 text-sm leading-7 text-muted">{partner.description}</p>

              <h3 className="mt-6 text-sm font-semibold text-foreground">Syarat Menjadi Partner:</h3>
              <ul className="mt-3 space-y-3">
                {partner.requirements.map((req) => (
                  <li key={req} className="flex items-start gap-3 text-sm text-foreground/80">
                    <CheckIcon />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href={partner.href}
                  className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-teal-deep transition-colors hover:bg-gold-bright focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
                >
                  Lihat Selengkapnya
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-cream-2">
        <div className="rounded-[2.5rem] border border-gold/15 bg-gold/5 p-10 text-center shadow-2xl shadow-black/5 sm:p-14">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gold/80">
            Proses Kemitraan
          </p>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
            Alur Program Kemitraan D&apos;JAEMO
          </h2>
          <div className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/90 p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-ink">01</div>
              <p className="mt-2 text-sm text-muted">Registrasi Partner</p>
            </div>
            <div className="rounded-3xl bg-white/90 p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-ink">02</div>
              <p className="mt-2 text-sm text-muted">Review oleh Admin</p>
            </div>
            <div className="rounded-3xl bg-white/90 p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-ink">03</div>
              <p className="mt-2 text-sm text-muted">Partner Aktif</p>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-muted leading-8">
            Setiap calon Partner akan melalui proses review oleh tim admin sebelum dapat mulai beroperasi sebagai Partner aktif D&apos;JAEMO.
          </p>
        </div>
      </Section>
    </>
  );
}
