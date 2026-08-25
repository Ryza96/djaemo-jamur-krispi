import type { Metadata } from "next";
import Link from "next/link";
import { SITE, PARTNER_COMING_SOON } from "@/lib/constants";
import { DropshipperRegistrationForm } from "./DropshipperRegistrationForm";

export const metadata: Metadata = {
  title: "Registrasi Dropshipper",
  description: `Registrasi Dropshipper ${SITE.name} — Program Kemitraan Resmi.`,
};

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-gold">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export default function DropshipperRegisterPage() {
  if (PARTNER_COMING_SOON) {
    return (
      <div className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg text-center">
          <div className="rounded-4xl border border-gold/20 bg-white p-10 shadow-sm sm:p-14">
            <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
              <ClockIcon />
            </div>
            <h2 className="text-2xl font-bold text-ink">Segera Hadir</h2>
            <p className="mt-4 text-sm leading-7 text-ink-soft">
              Registrasi Dropshipper sedang kami siapkan.
              Nantikan info selanjutnya!
            </p>
            <div className="mt-8">
              <Link
                href="/partner/dropshipper"
                className="inline-flex items-center justify-center rounded-full border-2 border-gold px-6 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-ink focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
              >
                Kembali ke Program Dropshipper
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <DropshipperRegistrationForm />;
}
