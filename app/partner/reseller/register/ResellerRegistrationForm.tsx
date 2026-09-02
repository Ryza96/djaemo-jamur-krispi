"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/constants";
import { RegistrationProgress } from "@/components/partner/RegistrationProgress";

const STEP_LABELS = ["Data Diri", "Cara Menjual", "Konfirmasi"];

const SALES_CHANNEL_OPTIONS = ["Marketplace", "Media Sosial", "Toko Offline", "Lainnya"];

interface ResellerFormData {
  fullName: string;
  whatsapp: string;
  email: string;
  salesChannels: string[];
  links: string;
  salesPlan: string;
  confirmData: boolean;
  confirmReview: boolean;
}

const initialFormData: ResellerFormData = {
  fullName: "",
  whatsapp: "",
  email: "",
  salesChannels: [],
  links: "",
  salesPlan: "",
  confirmData: false,
  confirmReview: false,
};

const inputClass =
  "mt-2 block w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:border-teal-deep focus:outline-none focus:ring-2 focus:ring-teal-deep/20";

const labelClass = "block text-sm font-medium text-foreground";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function ResellerRegistrationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ResellerFormData>(initialFormData);

  const handleChange = (field: keyof ResellerFormData, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleChannel = (option: string, checked: boolean) => {
    setData((prev) => ({
      ...prev,
      salesChannels: checked
        ? [...prev.salesChannels, option]
        : prev.salesChannels.filter((c) => c !== option),
    }));
  };

  const canProceedStep1 =
    data.fullName.trim() !== "" && data.whatsapp.trim() !== "" && isValidEmail(data.email);

  const canProceedStep2 =
    data.salesChannels.length > 0 && data.salesPlan.trim() !== "";

  const canSubmit = data.confirmData && data.confirmReview;

  const handleNext = () => {
    if (step < STEP_LABELS.length) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/partner/reseller/register/success");
  };

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink md:text-[30px]">Registrasi Reseller</h1>
          <p className="mt-2 text-sm text-muted">
            Program Kemitraan Resmi {SITE.name}
          </p>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-lg sm:p-8">
          <RegistrationProgress currentStep={step} stepLabels={STEP_LABELS} />

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="fullName" className={labelClass}>
                    Nama Lengkap <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    className={inputClass}
                    placeholder="Masukkan nama lengkap Anda"
                    value={data.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="whatsapp" className={labelClass}>
                    Nomor WhatsApp <span className="text-red">*</span>
                  </label>
                  <input
                    type="tel"
                    id="whatsapp"
                    className={inputClass}
                    placeholder="Contoh: 08123456789"
                    value={data.whatsapp}
                    onChange={(e) => handleChange("whatsapp", e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email <span className="text-red">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    className={inputClass}
                    placeholder="Masukkan email Anda"
                    value={data.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                  {data.email.trim() !== "" && !isValidEmail(data.email) && (
                    <p className="mt-1 text-xs text-red">Format email tidak valid.</p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>
                    Saluran Penjualan <span className="text-red">*</span>
                  </label>
                  <p className="mt-1 text-xs text-muted">Pilih satu atau lebih saluran penjualan Anda.</p>
                  <div className="mt-3 space-y-3">
                    {SALES_CHANNEL_OPTIONS.map((option) => {
                      const isSelected = data.salesChannels.includes(option);
                      return (
                        <label
                          key={option}
                          className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-colors ${
                            isSelected
                              ? "border-gold bg-teal-deep/5"
                              : "border-ink/10 bg-white hover:border-ink/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleChannel(option, e.target.checked)}
                            className="h-4 w-4 rounded border-ink/20 text-teal-deep focus:ring-teal-deep/20"
                          />
                          <span className="text-sm font-medium text-foreground">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="links" className={labelClass}>
                    Link Marketplace / Media Sosial <span className="text-muted">(opsional)</span>
                  </label>
                  <input
                    type="url"
                    id="links"
                    className={inputClass}
                    placeholder="Contoh: https://tokopedia.com/toko-anda"
                    value={data.links}
                    onChange={(e) => handleChange("links", e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="salesPlan" className={labelClass}>
                    Bagaimana Anda akan menjual produk D&apos;JAEMO? <span className="text-red">*</span>
                  </label>
                  <textarea
                    id="salesPlan"
                    rows={4}
                    className={inputClass}
                    placeholder="Jelaskan bagaimana Anda akan menjual produk D'JAEMO"
                    value={data.salesPlan}
                    onChange={(e) => handleChange("salesPlan", e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-ink/10 bg-white p-5">
                  <h3 className="text-sm font-semibold text-ink">Data Diri</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Nama Lengkap</dt>
                      <dd className="font-medium text-foreground">{data.fullName || "-"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">WhatsApp</dt>
                      <dd className="font-medium text-foreground">{data.whatsapp || "-"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Email</dt>
                      <dd className="font-medium text-foreground">{data.email || "-"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-ink/10 bg-white p-5">
                  <h3 className="text-sm font-semibold text-ink">Cara Menjual</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Saluran Penjualan</dt>
                      <dd className="font-medium text-foreground">
                        {data.salesChannels.length > 0 ? data.salesChannels.join(", ") : "-"}
                      </dd>
                    </div>
                    {data.links.trim() !== "" && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Link Marketplace / Media Sosial</dt>
                        <dd className="max-w-[60%] truncate text-right font-medium text-foreground">
                          {data.links}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted">Bagaimana Anda akan menjual produk D&apos;JAEMO?</dt>
                      <dd className="mt-1 text-sm text-foreground">{data.salesPlan || "-"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-4 rounded-2xl border border-ink/10 bg-white p-5">
                  <h3 className="text-sm font-semibold text-ink">Konfirmasi</h3>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={data.confirmData}
                      onChange={(e) => handleChange("confirmData", e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-ink/20 text-teal-deep focus:ring-teal-deep/20"
                    />
                    <span className="text-sm text-foreground/80">
                      Data yang saya berikan benar.
                    </span>
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={data.confirmReview}
                      onChange={(e) => handleChange("confirmReview", e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-ink/20 text-teal-deep focus:ring-teal-deep/20"
                    />
                    <span className="text-sm text-foreground/80">
                      Saya memahami pendaftaran akan ditinjau oleh D&apos;JAEMO.
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center justify-center rounded-full border-2 border-gold px-6 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-teal-deep focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
                >
                  Kembali
                </button>
              ) : (
                <Link
                  href="/partner/reseller"
                  className="inline-flex items-center justify-center rounded-full border-2 border-gold px-6 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-teal-deep focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
                >
                  Kembali
                </Link>
              )}

              {step < STEP_LABELS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2)
                  }
                  className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-teal-deep transition-colors hover:bg-gold-bright focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-teal-deep transition-colors hover:bg-gold-bright focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ajukan Pendaftaran Reseller
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
