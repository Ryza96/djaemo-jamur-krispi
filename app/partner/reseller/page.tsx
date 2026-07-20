import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "Program Reseller",
  description: `Program Kemitraan Resmi ${SITE.name} untuk Reseller.`,
};

const suitableFor = [
  "Pemilik toko offline",
  "Pemilik toko online",
  "UMKM",
  "Individu yang ingin menjadi Partner resmi D'JAEMO",
];

const benefits = [
  "Harga khusus Partner",
  "Program Kemitraan resmi D'JAEMO",
  "Dapat melakukan pembelian sesuai Business Rule yang berlaku",
  "Dapat menggunakan akun Partner sesuai Business Rule yang berlaku",
];

const rules = [
  "Minimal pembelian 10 pcs per varian produk",
  "Maksimal pembelian 100 pcs per transaksi",
  "Harga mengikuti Business Rule Partner",
  "Promo Customer tidak berlaku",
  "Approval oleh Admin bersifat wajib",
];

const flowSteps = [
  { step: "01", label: "Registrasi Partner" },
  { step: "02", label: "Review oleh Admin" },
  { step: "03", label: "Partner Aktif" },
  { step: "04", label: "Login" },
  { step: "05", label: "Melakukan Order" },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 text-accent">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 text-primary">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

export default function ResellerPage() {
  return (
    <>
      <Section className="bg-surface-dark">
        <PageHeader
          title="Program Reseller D'JAEMO"
          description="Program Kemitraan Resmi untuk mendistribusikan produk D'JAEMO."
        />
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Section 1</p>
          <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">Apa itu Reseller?</h2>
          <div className="mt-6 rounded-3xl border border-primary/10 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-sm leading-7 text-muted">
              Reseller merupakan Partner resmi D&apos;JAEMO yang dapat melakukan pembelian
              produk sesuai Business Rule yang berlaku untuk kebutuhan usaha maupun
              penggunaan pribadi.
            </p>
          </div>
        </div>
      </Section>

      <Section className="bg-surface-dark">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Section 2</p>
          <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">Siapa yang Cocok Menjadi Partner?</h2>
          <ul className="mt-6 space-y-4">
            {suitableFor.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground/80">
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Section 3</p>
          <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">Apa yang Akan Anda Dapatkan?</h2>
          <ul className="mt-6 space-y-4">
            {benefits.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground/80">
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section className="bg-surface-dark">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Section 4</p>
          <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">Hal yang Perlu Anda Ketahui</h2>
          <div className="mt-6 rounded-3xl border border-primary/10 bg-white p-8 shadow-sm sm:p-10">
            <ul className="space-y-4">
              {rules.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/80">
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-7 text-muted">
              Apabila membutuhkan jumlah yang lebih besar dari batas yang berlaku,
              Partner dapat menghubungi Admin D&apos;JAEMO.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Section 5</p>
          <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">Alur Menjadi Partner</h2>
          <div className="mt-6 space-y-0">
            {flowSteps.map((step, index) => (
              <div key={step.step}>
                <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-primary/10">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {step.step}
                  </div>
                  <span className="text-sm font-medium text-foreground">{step.label}</span>
                </div>
                {index < flowSteps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowIcon />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-surface-dark">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Section 6</p>
          <h2 className="mt-3 text-2xl font-bold text-primary sm:text-3xl">Saya Siap Menjadi Partner D&apos;JAEMO</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
            Pastikan Anda telah membaca seluruh informasi di atas sebelum melanjutkan ke proses registrasi.
          </p>
          <div className="mt-8">
            <Button href="/partner/register" variant="primary" className="px-10">
              Lanjutkan
            </Button>
          </div>
          <div className="mt-6">
            <Link href="/partner" className="text-sm font-medium text-primary hover:underline">
              Kembali ke Program Kemitraan
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
