"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { SITE } from "@/lib/constants";
import { RegistrationProgress } from "@/components/partner/RegistrationProgress";

const STEP_LABELS = ["Data Diri", "Cara Menjual", "Konfirmasi"];

const SALES_CHANNEL_OPTIONS = ["Marketplace", "Media Sosial", "Toko Offline", "Lainnya"];

interface ResellerFormData {
  fullName: string;
  whatsapp: string;
  email: string;
  username: string;
  password: string;
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
  username: "",
  password: "",
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
  return /^[^\s@]+@\S+\.\S+$/.test(email.trim());
}

// Validasi username yang sama dengan schema zod di
// app/api/partner/register/route.ts (huruf/angka/underscore, 3-30) —
// semua saran wajib lolos regex ini agar bisa dipakai apa adanya.
const USERNAME_SUGGESTION_REGEX = /^[A-Za-z0-9_]+$/;

function randomDigits(count: number): string {
  return Math.floor(Math.random() * 10 ** count)
    .toString()
    .padStart(count, "0");
}

/**
 * Generate maksimal 3 saran username dari nama lengkap:
 *  1. Nama digabung tanpa spasi            → "budisantoso"
 *  2. Nama depan + nama belakang           → "budi_santoso"
 *     (nama 1 kata → nama + 2 digit acak)  → "budi42"
 *  3. Nama gabung + 2-3 digit acak         → "budisantoso27"
 *
 * CATATAN: variasi 2 memakai underscore, bukan titik, karena regex
 * validasi username hanya mengizinkan huruf/angka/underscore — saran
 * dijamin otomatis lolos validasi (dan tetap dibersihkan + difilter
 * panjang 3-30 di bawah sebelum ditampilkan).
 */
function generateUsernameSuggestions(fullName: string): string[] {
  const cleaned = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
  const words = cleaned.split(" ").filter((word) => word !== "");
  if (words.length === 0) return [];

  const joined = words.join("");
  const candidates: string[] = [joined];

  if (words.length >= 2) {
    candidates.push(`${words[0]}_${words[words.length - 1]}`);
  } else {
    candidates.push(`${joined}${randomDigits(2)}`);
  }

  candidates.push(`${joined}${randomDigits(Math.random() < 0.5 ? 2 : 3)}`);

  const seen = new Set<string>();
  const suggestions: string[] = [];
  for (const candidate of candidates) {
    if (
      USERNAME_SUGGESTION_REGEX.test(candidate) &&
      candidate.length >= 3 &&
      candidate.length <= 30 &&
      !seen.has(candidate)
    ) {
      seen.add(candidate);
      suggestions.push(candidate);
    }
    if (suggestions.length === 3) break;
  }
  return suggestions;
}

export function ResellerRegistrationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ResellerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  // Cek email real-time saat klik "Selanjutnya" di step 1 (Task B):
  // - checkingEmail: loading tombol ("Memeriksa...")
  // - emailCheckError: email terdaftar → blokir pindah step (merah)
  // - emailCheckWarning: cek gagal (network/dll) → tidak memblokir,
  //   klik "Selanjutnya" lagi boleh lanjut (submit tetap validasi ulang)
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState<string | null>(null);
  const [emailCheckWarning, setEmailCheckWarning] = useState<string | null>(null);

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
    data.fullName.trim() !== "" &&
    data.whatsapp.trim() !== "" &&
    isValidEmail(data.email) &&
    data.username.trim().length >= 3 &&
    data.password.length >= 8;

  const canProceedStep2 =
    data.salesChannels.length > 0 && data.salesPlan.trim() !== "";

  const canSubmit = data.confirmData && data.confirmReview;

  // Saran username hanya bergantung pada nama lengkap (di-memo agar
  // angka acaknya tidak berubah setiap ketikan/klik lain); ditampilkan
  // hanya saat field username masih kosong (dicek saat render).
  const usernameSuggestions = useMemo(
    () => generateUsernameSuggestions(data.fullName),
    [data.fullName],
  );

  const handleNext = async () => {
    if (checkingEmail) return;

    if (step === 1 && canProceedStep1) {
      // Email sudah diketahui terdaftar → tetap blokir sampai user
      // mengedit ulang field email (menghapus pesan error ini).
      if (emailCheckError) return;

      // Cek email hanya sekali per isi email; bila sebelumnya gagal
      // (emailCheckWarning terisi), jangan menahan user — izinkan lanjut.
      if (emailCheckWarning === null) {
        setCheckingEmail(true);
        try {
          const res = await fetch(
            `/api/partner/check-email?email=${encodeURIComponent(data.email.trim())}`,
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const payload = (await res.json()) as {
            taken?: boolean;
            partnerType?: string;
          };

          if (payload.taken) {
            const label =
              payload.partnerType === "reseller"
                ? "Reseller"
                : payload.partnerType === "dropshipper"
                  ? "Dropshipper"
                  : "Partner";
            setEmailCheckError(`Email sudah terdaftar sebagai ${label}`);
            return;
          }
        } catch {
          setEmailCheckWarning(
            "Pengecekan email gagal — klik Selanjutnya untuk melanjutkan; email tetap divalidasi ulang saat submit.",
          );
          return;
        } finally {
          setCheckingEmail(false);
        }
      }
    }

    if (step < STEP_LABELS.length) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/partner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerType: "reseller",
          username: data.username.trim(),
          password: data.password,
          fullName: data.fullName.trim(),
          whatsapp: data.whatsapp.trim(),
          email: data.email.trim(),
          salesChannels: data.salesChannels,
          links: data.links.trim(),
          salesPlan: data.salesPlan.trim(),
          confirmData: data.confirmData,
          confirmReview: data.confirmReview,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(
          payload?.error || "Gagal mendaftar. Coba lagi nanti.",
        );
      }

      router.push("/partner/reseller/register/success");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Gagal mendaftar. Coba lagi nanti.",
      );
      setIsSubmitting(false);
    }
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
                    onChange={(e) => {
                      handleChange("email", e.target.value);
                      // Pesan cek email berlaku untuk nilai lama —
                      // hapus otomatis begitu user mengedit email.
                      setEmailCheckError(null);
                      setEmailCheckWarning(null);
                    }}
                  />
                  {data.email.trim() !== "" && !isValidEmail(data.email) && (
                    <p className="mt-1 text-xs text-red">Format email tidak valid.</p>
                  )}
                  {emailCheckError && (
                    <p className="mt-1 text-xs text-red" role="alert">
                      {emailCheckError}
                    </p>
                  )}
                  {emailCheckWarning && (
                    <p className="mt-1 text-xs text-amber-600">{emailCheckWarning}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="username" className={labelClass}>
                    Username <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    autoComplete="username"
                    className={inputClass}
                    placeholder="Untuk login partner (huruf, angka, underscore)"
                    value={data.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                  />
                  {data.username.trim() !== "" && data.username.trim().length < 3 && (
                    <p className="mt-1 text-xs text-red">Username minimal 3 karakter.</p>
                  )}
                  {data.username === "" && usernameSuggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted">
                        Saran username (klik untuk memakai):
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {usernameSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleChange("username", suggestion)}
                            className="cursor-pointer rounded-full border border-teal-deep/30 px-3 py-1 text-xs font-medium text-teal-deep transition-colors hover:bg-teal-deep/10 focus:outline-none focus:ring-2 focus:ring-teal-deep/20"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className={labelClass}>
                    Password <span className="text-red">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      autoComplete="new-password"
                      className={`${inputClass} pr-10`}
                      placeholder="Minimal 8 karakter"
                      value={data.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Sembunyikan password" : "Tampilkan password"
                      }
                      className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-muted transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-teal-deep/20"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {data.password !== "" && data.password.length < 8 && (
                    <p className="mt-1 text-xs text-red">Password minimal 8 karakter.</p>
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
                      <dt className="text-muted">Username</dt>
                      <dd className="font-medium text-foreground">{data.username || "-"}</dd>
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

                  <label className="flex cursor-pointer items-start gap-3">
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

                  <label className="flex cursor-pointer items-start gap-3">
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

            {submitError && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
              >
                {submitError}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex cursor-pointer items-center justify-center rounded-full border-2 border-gold px-6 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-teal-deep focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
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
                    checkingEmail ||
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2)
                  }
                  className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-teal-deep transition-colors hover:bg-gold-bright focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checkingEmail ? "Memeriksa..." : "Selanjutnya"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-teal-deep transition-colors hover:bg-gold-bright focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Mengirim..." : "Ajukan Pendaftaran Reseller"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
