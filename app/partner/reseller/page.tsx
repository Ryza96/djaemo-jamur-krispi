import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { PageHeader, Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "Reseller",
  description: `Program Reseller ${SITE.name} — Segera Hadir.`,
};

export default function ResellerPage() {
  return (
    <Section>
      <PageHeader
        title="Program Reseller"
        description="Halaman ini sedang dalam persiapan."
      />

      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-4xl border border-primary/10 bg-white p-10 shadow-sm sm:p-14">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
              <path d="M12 2v20M2 12h20" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-primary">Segera Hadir</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Halaman registrasi Reseller akan tersedia pada WO-PARTNER-003.2.
          </p>
          <div className="mt-8">
            <Link
              href="/partner"
              className="inline-flex items-center justify-center rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Kembali ke Partner
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
