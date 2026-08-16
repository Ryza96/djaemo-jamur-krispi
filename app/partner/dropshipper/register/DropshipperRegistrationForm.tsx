"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/constants";
import { RegistrationProgress } from "@/components/partner/RegistrationProgress";

const STEP_LABELS = ["Data Diri", "Cara Memasarkan", "Konfirmasi"];

const CHANNEL_OPTIONS = ["Media Sosial", "Marketplace", "Komunitas", "Lainnya"];

interface DropshipperFormData {
  fullName: string;
  whatsapp: string;
  email: string;
  salesChannel: string;
  channelLink: string;
  marketingPlan: string;
  confirmData: boolean;
  confirmReview: boolean;
}

const initialFormData: DropshipperFormData = {
  fullName: "",
  whatsapp: "",
  email: "",
  salesChannel: "",
  channelLink: "",
  marketingPlan: "",
  confirmData: false,
  confirmReview: false,
};

const inputClass =
  "mt-2 block w-full rounded-2xl border border-primary/10 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const labelClass = "block text-sm font-medium text-foreground";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function DropshipperRegistrationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<DropshipperFormData>(initialFormData);

  const handleChange = (field: keyof DropshipperFormData, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceedStep1 =
    data.fullName.trim() !== "" && data.whatsapp.trim() !== "" && isValidEmail(data.email);

  const canProceedStep2 =
    data.salesChannel !== "" &&
    data.channelLink.trim() !== "" &&
    data.marketingPlan.trim() !== "";

  const canSubmit = data.confirmData && data.confirmReview;

  const handleNext = () => {
    if (step < STEP_LABELS.length) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/partner/dropshipper/register/success");
  };

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">Registrasi Dropshipper</h1>
          <p className="mt-2 text-sm text-muted">
            Program Kemitraan Resmi {SITE.name}
          </p>
        </div>

        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-lg sm:p-8">
          <RegistrationProgress currentStep={step} stepLabels={STEP_LABELS} />

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="fullName" className={labelClass}>
                    Nama Lengkap <span className="text-red-500">*</span>
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
                    Nomor WhatsApp <span className="text-red-500">*</span>
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
                    Email <span className="text-red-500">*</span>
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
                    <p className="mt-1 text-xs text-red-500">Format email tidak valid.</p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>
                    Media / Channel Penjualan <span className="text-red-500">*</span>
                  </label>
                  <p className="mt-1 text-xs text-muted">Pilih satu media atau channel utama Anda.</p>
                  <div className="mt-3 space-y-3">
                    {CHANNEL_OPTIONS.map((option) => {
                      const isSelected = data.salesChannel === option;
                      return (
                        <label
                          key={option}
                          className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-primary/10 bg-white hover:border-primary/30"
                          }`}
                        >
                          <input
                            type="radio"
                            name="salesChannel"
                            value={option}
                            checked={isSelected}
                            onChange={() => handleChange("salesChannel", option)}
                            className="h-4 w-4 text-primary focus:ring-primary/20"
                          />
                          <span className="text-sm font-medium text-foreground">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="channelLink" className={labelClass}>
                    Link Media / Channel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    id="channelLink"
                    className={inputClass}
                    placeholder="Contoh: https://instagram.com/akunanda"
                    value={data.channelLink}
                    onChange={(e) => handleChange("channelLink", e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="marketingPlan" className={labelClass}>
                    Bagaimana Anda akan memasarkan produk D&apos;JAEMO? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="marketingPlan"
                    rows={4}
                    className={inputClass}
                    placeholder="Jelaskan strategi atau rencana pemasaran Anda untuk produk D'JAEMO"
                    value={data.marketingPlan}
                    onChange={(e) => handleChange("marketingPlan", e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-primary/10 bg-surface p-5">
                  <h3 className="text-sm font-semibold text-primary">Data Diri</h3>
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

                <div className="rounded-2xl border border-primary/10 bg-surface p-5">
                  <h3 className="text-sm font-semibold text-primary">Cara Memasarkan</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Media / Channel Penjualan</dt>
                      <dd className="font-medium text-foreground">{data.salesChannel || "-"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Link Media / Channel</dt>
                      <dd className="max-w-[60%] truncate text-right font-medium text-foreground">
                        {data.channelLink || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Bagaimana Anda akan memasarkan produk D&apos;JAEMO?</dt>
                      <dd className="mt-1 text-sm text-foreground">{data.marketingPlan || "-"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-4 rounded-2xl border border-primary/10 bg-surface p-5">
                  <h3 className="text-sm font-semibold text-primary">Konfirmasi</h3>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={data.confirmData}
                      onChange={(e) => handleChange("confirmData", e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary/20"
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
                      className="mt-0.5 h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary/20"
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
                  className="inline-flex items-center justify-center rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Kembali
                </button>
              ) : (
                <Link
                  href="/partner/dropshipper"
                  className="inline-flex items-center justify-center rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ajukan Pendaftaran Dropshipper
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
