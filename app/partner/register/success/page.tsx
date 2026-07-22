import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { PageHeader, Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "Registrasi Berhasil",
  description: `Registrasi Program Kemitraan ${SITE.name} berhasil dilakukan.`,
};

export default function PartnerRegisterSuccessPage() {
  return (
    <Section>
      <PageHeader
        title="Registrasi Berhasil"
        description={`Terima kasih telah melakukan registrasi Program Kemitraan ${SITE.name}.`}
      />

      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-4xl border border-primary/10 bg-white p-10 shadow-sm sm:p-14">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-primary">Registrasi Berhasil</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
            <p>
              Program Kemitraan {SITE.name} saat ini masih berada dalam tahap pengembangan.
            </p>
            <p>
              Tahap review dan approval Partner akan tersedia pada Sprint berikutnya.
            </p>
            <p>
              Terima kasih telah membantu kami membangun Program Kemitraan resmi {SITE.name} yang lebih baik.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            <Link
              href="/partner"
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
            >
              Kembali ke Program Kemitraan
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
