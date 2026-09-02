"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/constants";
import { LiveSelfieCapture } from "@/components/partner/LiveSelfieCapture";

const TOTAL_STEPS = 5;

const STEP_LABELS = ["Tentang Anda", "Program Kemitraan", "Data Kemitraan", "Live Selfie", "Verifikasi Data"];

interface FormData {
  fullName: string;
  email: string;
  whatsapp: string;
  selfieDataUrl: string | null;
  partnerType: "reseller" | "dropshipper" | "";
  resellerStoreName: string;
  resellerStoreType: string;
  resellerAddress: string;
  resellerProvince: string;
  resellerRegency: string;
  resellerDistrict: string;
  resellerMarketplace: string;
  resellerSocialMedia: string;
  dropshipperNickname: string;
  dropshipperSocialMedia: string;
  dropshipperSocialLink: string;
  dropshipperMarketingPlan: string;
  confirmData: boolean;
  confirmReview: boolean;
  confirmApproval: boolean;
  confirmRules: boolean;
}

const initialFormData: FormData = {
  fullName: "",
  email: "",
  whatsapp: "",
  selfieDataUrl: null,
  partnerType: "",
  resellerStoreName: "",
  resellerStoreType: "",
  resellerAddress: "",
  resellerProvince: "",
  resellerRegency: "",
  resellerDistrict: "",
  resellerMarketplace: "",
  resellerSocialMedia: "",
  dropshipperNickname: "",
  dropshipperSocialMedia: "",
  dropshipperSocialLink: "",
  dropshipperMarketingPlan: "",
  confirmData: false,
  confirmReview: false,
  confirmApproval: false,
  confirmRules: false,
};

const inputClass =
  "mt-2 block w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:border-teal-deep focus:outline-none focus:ring-2 focus:ring-teal-deep/20";

const labelClass = "block text-sm font-medium text-foreground";

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8 sm:mb-10">
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors sm:h-10 sm:w-10 ${
                    isCompleted
                      ? "bg-accent text-white"
                      : isActive
                        ? "bg-gold text-teal-deep"
                        : "bg-teal-deep/10 text-teal-deep/40"
                  }`}
                >
                  {isCompleted ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`mt-2 hidden text-center text-xs font-medium sm:block ${
                    isActive ? "text-ink" : isCompleted ? "text-accent" : "text-muted/50"
                  }`}
                >
                  {label}
                </span>
              </div>
              {index < STEP_LABELS.length - 1 && (
                <div className="mx-1 flex-1 sm:mx-2">
                  <div
                    className={`h-0.5 w-full ${
                      isCompleted ? "bg-accent" : "bg-teal-deep/10"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-center text-xs text-muted sm:hidden">
        Langkah {currentStep} dari {TOTAL_STEPS}: {STEP_LABELS[currentStep - 1]}
      </div>
    </div>
  );
}

function StepTentangAnda({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (field: keyof FormData, value: string | File | null) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="fullName" className={labelClass}>
          Nama Lengkap <span className="text-red">*</span>
        </label>
        <input
          type="text"
          id="fullName"
          required
          className={inputClass}
          placeholder="Masukkan nama lengkap Anda"
          value={data.fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email <span className="text-red">*</span>
        </label>
        <input
          type="email"
          id="email"
          required
          className={inputClass}
          placeholder="Masukkan email Anda"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="whatsapp" className={labelClass}>
          Nomor WhatsApp <span className="text-red">*</span>
        </label>
        <input
          type="tel"
          id="whatsapp"
          required
          className={inputClass}
          placeholder="Contoh: 08123456789"
          value={data.whatsapp}
          onChange={(e) => onChange("whatsapp", e.target.value)}
        />
      </div>

    </div>
  );
}

function StepProgramKemitraan({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-muted">
        Pilih model kemitraan yang paling sesuai dengan Anda. Anda hanya dapat memilih salah satu.
      </p>

      <label
        className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-colors ${
          data.partnerType === "reseller"
            ? "border-gold bg-teal-deep/5"
            : "border-ink/10 bg-white hover:border-ink/30"
        }`}
      >
        <input
          type="radio"
          name="partnerType"
          value="reseller"
          checked={data.partnerType === "reseller"}
          onChange={() => onChange("partnerType", "reseller")}
          className="mt-1 h-4 w-4 text-teal-deep focus:ring-teal-deep/20"
        />
        <div>
          <span className="text-sm font-semibold text-ink">Reseller</span>
          <p className="mt-1 text-xs text-muted">
            Partner resmi D&apos;JAEMO yang dapat melakukan pembelian produk sesuai Business Rule yang berlaku.
          </p>
        </div>
      </label>

      <label
        className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-colors ${
          data.partnerType === "dropshipper"
            ? "border-gold bg-teal-deep/5"
            : "border-ink/10 bg-white hover:border-ink/30"
        }`}
      >
        <input
          type="radio"
          name="partnerType"
          value="dropshipper"
          checked={data.partnerType === "dropshipper"}
          onChange={() => onChange("partnerType", "dropshipper")}
          className="mt-1 h-4 w-4 text-teal-deep focus:ring-teal-deep/20"
        />
        <div>
          <span className="text-sm font-semibold text-ink">Dropshipper</span>
          <p className="mt-1 text-xs text-muted">
            Partner yang dapat memasarkan produk D&apos;JAEMO tanpa perlu menyediakan stok produk sendiri.
          </p>
        </div>
      </label>
    </div>
  );
}

function StepDataKemitraan({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  if (data.partnerType === "reseller") {
    return (
      <div className="space-y-5">
        <div>
          <label htmlFor="storeName" className={labelClass}>
            Nama Toko <span className="text-red">*</span>
          </label>
          <input
            type="text"
            id="storeName"
            required
            className={inputClass}
            placeholder="Masukkan nama toko Anda"
            value={data.resellerStoreName}
            onChange={(e) => onChange("resellerStoreName", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="storeType" className={labelClass}>
            Jenis Toko <span className="text-red">*</span>
          </label>
          <select
            id="storeType"
            required
            className={inputClass}
            value={data.resellerStoreType}
            onChange={(e) => onChange("resellerStoreType", e.target.value)}
          >
            <option value="">Pilih jenis toko</option>
            <option value="offline">Toko Offline</option>
            <option value="online">Toko Online</option>
            <option value="both">Offline & Online</option>
          </select>
        </div>

        <div>
          <label htmlFor="address" className={labelClass}>
            Alamat <span className="text-red">*</span>
          </label>
          <textarea
            id="address"
            required
            rows={3}
            className={inputClass}
            placeholder="Masukkan alamat lengkap toko Anda"
            value={data.resellerAddress}
            onChange={(e) => onChange("resellerAddress", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="province" className={labelClass}>
              Provinsi <span className="text-red">*</span>
            </label>
            <input
              type="text"
              id="province"
              required
              className={inputClass}
              placeholder="Masukkan nama provinsi"
              value={data.resellerProvince}
              onChange={(e) => onChange("resellerProvince", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="regency" className={labelClass}>
              Kabupaten / Kota <span className="text-red">*</span>
            </label>
            <input
              type="text"
              id="regency"
              required
              className={inputClass}
              placeholder="Masukkan kabupaten atau kota"
              value={data.resellerRegency}
              onChange={(e) => onChange("resellerRegency", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="district" className={labelClass}>
            Kecamatan <span className="text-red">*</span>
          </label>
          <input
            type="text"
            id="district"
            required
            className={inputClass}
            placeholder="Masukkan nama kecamatan"
            value={data.resellerDistrict}
            onChange={(e) => onChange("resellerDistrict", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="marketplace" className={labelClass}>
            Link Marketplace <span className="text-muted">(opsional)</span>
          </label>
          <input
            type="url"
            id="marketplace"
            className={inputClass}
            placeholder="Contoh: https://tokopedia.com/toko-anda"
            value={data.resellerMarketplace}
            onChange={(e) => onChange("resellerMarketplace", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="resellerSocial" className={labelClass}>
            Sosial Media <span className="text-muted">(opsional)</span>
          </label>
          <input
            type="text"
            id="resellerSocial"
            className={inputClass}
            placeholder="Contoh: @tokoanda"
            value={data.resellerSocialMedia}
            onChange={(e) => onChange("resellerSocialMedia", e.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="nickname" className={labelClass}>
          Nama Panggilan <span className="text-red">*</span>
        </label>
        <input
          type="text"
          id="nickname"
          required
          className={inputClass}
          placeholder="Masukkan nama panggilan Anda"
          value={data.dropshipperNickname}
          onChange={(e) => onChange("dropshipperNickname", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="dsSocialMedia" className={labelClass}>
          Sosial Media <span className="text-red">*</span>
        </label>
        <input
          type="text"
          id="dsSocialMedia"
          required
          className={inputClass}
          placeholder="Contoh: Instagram, TikTok, Shopee"
          value={data.dropshipperSocialMedia}
          onChange={(e) => onChange("dropshipperSocialMedia", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="socialLink" className={labelClass}>
          Link Sosial Media <span className="text-red">*</span>
        </label>
        <input
          type="url"
          id="socialLink"
          required
          className={inputClass}
          placeholder="Contoh: https://instagram.com/akunanda"
          value={data.dropshipperSocialLink}
          onChange={(e) => onChange("dropshipperSocialLink", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="marketingPlan" className={labelClass}>
          Bagaimana Anda akan memasarkan produk D&apos;JAEMO? <span className="text-red">*</span>
        </label>
        <textarea
          id="marketingPlan"
          required
          rows={4}
          className={inputClass}
          placeholder="Jelaskan strategi atau rencana pemasaran Anda untuk produk D'JAEMO"
          value={data.dropshipperMarketingPlan}
          onChange={(e) => onChange("dropshipperMarketingPlan", e.target.value)}
        />
      </div>
    </div>
  );
}

function StepVerifikasiData({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (field: keyof FormData, value: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        <h3 className="text-sm font-semibold text-ink">Tentang Anda</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Nama Lengkap</dt>
            <dd className="font-medium text-foreground">{data.fullName || "-"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Email</dt>
            <dd className="font-medium text-foreground">{data.email || "-"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">WhatsApp</dt>
            <dd className="font-medium text-foreground">{data.whatsapp || "-"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Foto Selfie</dt>
            <dd className="font-medium text-foreground">
              {data.selfieDataUrl ? (
                <img src={data.selfieDataUrl} alt="Selfie" className="h-24 rounded-xl object-cover" />
              ) : (
                "-"
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        <h3 className="text-sm font-semibold text-ink">Program Kemitraan</h3>
        <p className="mt-2 text-sm font-medium text-foreground capitalize">
          {data.partnerType || "-"}
        </p>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        <h3 className="text-sm font-semibold text-ink">Data Kemitraan</h3>
        {data.partnerType === "reseller" ? (
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Nama Toko</dt>
              <dd className="font-medium text-foreground">{data.resellerStoreName || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Jenis Toko</dt>
              <dd className="font-medium text-foreground capitalize">{data.resellerStoreType || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Alamat</dt>
              <dd className="max-w-[60%] text-right font-medium text-foreground">{data.resellerAddress || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Provinsi</dt>
              <dd className="font-medium text-foreground">{data.resellerProvince || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Kabupaten / Kota</dt>
              <dd className="font-medium text-foreground">{data.resellerRegency || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Kecamatan</dt>
              <dd className="font-medium text-foreground">{data.resellerDistrict || "-"}</dd>
            </div>
            {data.resellerMarketplace && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Marketplace</dt>
                <dd className="max-w-[60%] truncate text-right font-medium text-foreground">{data.resellerMarketplace}</dd>
              </div>
            )}
            {data.resellerSocialMedia && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Sosial Media</dt>
                <dd className="font-medium text-foreground">{data.resellerSocialMedia}</dd>
              </div>
            )}
          </dl>
        ) : (
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Nama Panggilan</dt>
              <dd className="font-medium text-foreground">{data.dropshipperNickname || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Sosial Media</dt>
              <dd className="font-medium text-foreground">{data.dropshipperSocialMedia || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Link Sosial Media</dt>
              <dd className="max-w-[60%] truncate text-right font-medium text-foreground">{data.dropshipperSocialLink || "-"}</dd>
            </div>
            <div>
              <dt className="text-muted">Rencana Pemasaran</dt>
              <dd className="mt-1 text-sm text-foreground">{data.dropshipperMarketingPlan || "-"}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-ink/10 bg-white p-5">
        <h3 className="text-sm font-semibold text-ink">Konfirmasi</h3>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={data.confirmData}
            onChange={(e) => onChange("confirmData", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink/20 text-teal-deep focus:ring-teal-deep/20"
          />
          <span className="text-sm text-foreground/80">
            Seluruh data yang saya berikan adalah benar.
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={data.confirmReview}
            onChange={(e) => onChange("confirmReview", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink/20 text-teal-deep focus:ring-teal-deep/20"
          />
          <span className="text-sm text-foreground/80">
            Saya memahami bahwa registrasi Partner akan melalui proses review oleh Admin.
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={data.confirmApproval}
            onChange={(e) => onChange("confirmApproval", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink/20 text-teal-deep focus:ring-teal-deep/20"
          />
          <span className="text-sm text-foreground/80">
            Saya memahami bahwa approval Partner sepenuhnya merupakan keputusan Admin.
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={data.confirmRules}
            onChange={(e) => onChange("confirmRules", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink/20 text-teal-deep focus:ring-teal-deep/20"
          />
          <span className="text-sm text-foreground/80">
            Saya memahami Program Kemitraan D&apos;JAEMO yang berlaku.
          </span>
        </label>
      </div>
    </div>
  );
}

export function RegistrationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(initialFormData);

  const handleChange = (field: keyof FormData, value: string | File | boolean | null) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceedStep1 =
    data.fullName.trim() && data.email.trim() && data.whatsapp.trim();

  const canProceedStep2 = data.partnerType === "reseller" || data.partnerType === "dropshipper";

  const canProceedStep3 =
    data.partnerType === "reseller"
      ? data.resellerStoreName.trim() &&
        data.resellerStoreType &&
        data.resellerAddress.trim() &&
        data.resellerProvince.trim() &&
        data.resellerRegency.trim() &&
        data.resellerDistrict.trim()
      : data.dropshipperNickname.trim() &&
        data.dropshipperSocialMedia.trim() &&
        data.dropshipperSocialLink.trim() &&
        data.dropshipperMarketingPlan.trim();

  const canProceedStep4 = data.selfieDataUrl !== null;

  const canSubmit =
    data.confirmData && data.confirmReview && data.confirmApproval && data.confirmRules;

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/partner/register/success");
  };

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink md:text-[30px]">Registrasi Partner</h1>
          <p className="mt-2 text-sm text-muted">
            Program Kemitraan Resmi {SITE.name}
          </p>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-lg sm:p-8">
          <ProgressIndicator currentStep={step} />

          <form onSubmit={handleSubmit}>
            {step === 1 && <StepTentangAnda data={data} onChange={handleChange} />}
            {step === 2 && <StepProgramKemitraan data={data} onChange={handleChange} />}
            {step === 3 && <StepDataKemitraan data={data} onChange={handleChange} />}
            {step === 4 && (
              <LiveSelfieCapture
                onCapture={(url) => {
                  handleChange("selfieDataUrl", url);
                  setStep(5);
                }}
              />
            )}
            {step === 5 && <StepVerifikasiData data={data} onChange={handleChange} />}

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
                  href="/partner"
                  className="inline-flex items-center justify-center rounded-full border-2 border-gold px-6 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-teal-deep focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
                >
                  Kembali
                </Link>
              )}

              {step < TOTAL_STEPS && step !== 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2) ||
                    (step === 3 && !canProceedStep3)
                  }
                  className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-teal-deep transition-colors hover:bg-gold-bright focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              ) : step === 5 ? (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-teal-deep transition-colors hover:bg-gold-bright focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
