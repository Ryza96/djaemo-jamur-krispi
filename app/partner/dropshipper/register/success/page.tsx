import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { PageHeader, Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "Registrasi Berhasil",
  description: `Registrasi Dropshipper ${SITE.name} berhasil dilakukan.`,
};

export default function DropshipperRegisterSuccessPage() {
  return (
    <Section>
      <PageHeader
        title="Pengajuan Dropshipper Berhasil"
        description={`Program Kemitraan Resmi ${SITE.name}.`}
      />

      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-4xl border border-primary/10 bg-white p-10 shadow-sm sm:p-14">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-primary">Pengajuan Dropshipper Berhasil</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
            <p>
              Data pengajuan Anda telah selesai diisi. Tim D&apos;JAEMO akan melakukan peninjauan
              pada tahap berikutnya.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            <Link
              href="/partner/dropshipper"
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
            >
              Kembali ke Program Dropshipper
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
