"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/patterns/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { AdminSection } from "@/components/admin/patterns/AdminSection";
import type { VoucherListItem } from "@/lib/services/voucher.service";

type FormMode = "create" | "edit";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function utcToWibDate(isoStr: string): string {
  const d = new Date(new Date(isoStr).getTime() + WIB_OFFSET_MS);
  return d.toISOString().split("T")[0];
}

function utcToWibTime(isoStr: string): string {
  const d = new Date(new Date(isoStr).getTime() + WIB_OFFSET_MS);
  return d.toISOString().split("T")[1].slice(0, 5);
}

interface VoucherDetailResponse {
  success?: boolean;
  error?: string;
  data?: VoucherListItem;
}

export default function VoucherFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams?.get("mode");
  const idParam = searchParams?.get("id");
  const mode: FormMode = modeParam === "edit" && idParam ? "edit" : "create";
  const voucherId: string | null | undefined = idParam;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [minPurchase, setMinPurchase] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [validFromDate, setValidFromDate] = useState("");
  const [validFromTime, setValidFromTime] = useState("00:00");
  const [validUntilDate, setValidUntilDate] = useState("");
  const [validUntilTime, setValidUntilTime] = useState("23:59");

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !voucherId) return;
    if (fetchedIdRef.current === voucherId) return;
    fetchedIdRef.current = voucherId ?? null;

    fetch(`/api/admin/vouchers/${voucherId}`)
      .then((r) => r.json())
      .then((data: VoucherDetailResponse) => {
        if (!data.success || !data.data) {
          setError(data.error || "Voucher tidak ditemukan");
          return;
        }
        const v = data.data;
        setCode(v.code);
        setName(v.name);
        setDiscountPercent(String(v.discount_percent));
        setMinPurchase(String(v.min_purchase_amount));
        setMaxUses(v.max_uses === null ? "" : String(v.max_uses));
        setValidFromDate(utcToWibDate(v.valid_from));
        setValidFromTime(utcToWibTime(v.valid_from));
        setValidUntilDate(utcToWibDate(v.valid_until));
        setValidUntilTime(utcToWibTime(v.valid_until));
      })
      .catch(() => setError("Gagal memuat data voucher"))
      .finally(() => setLoading(false));
  }, [mode, voucherId]);

  const handleSave = async () => {
    setError(null);

    if (!code.trim()) {
      setError("Kode voucher harus diisi");
      return;
    }
    if (!name.trim()) {
      setError("Nama voucher harus diisi");
      return;
    }
    const percent = Number(discountPercent);
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
      setError("Diskon harus berupa persen utuh antara 1 dan 100");
      return;
    }
    const min = Number(minPurchase);
    if (!Number.isFinite(min) || min < 0) {
      setError("Minimal belanja tidak valid");
      return;
    }
    let maxUsesParsed: number | null = null;
    if (maxUses.trim() !== "") {
      const parsed = Number(maxUses);
      if (!Number.isInteger(parsed) || parsed < 1) {
        setError("Batas pemakaian harus bilangan bulat positif atau kosong");
        return;
      }
      maxUsesParsed = parsed;
    }
    if (!validFromDate || !validUntilDate) {
      setError("Periode berlaku harus diisi");
      return;
    }
    const validFrom = new Date(
      new Date(`${validFromDate}T${validFromTime}:00`).getTime() - WIB_OFFSET_MS,
    ).toISOString();
    const validUntil = new Date(
      new Date(`${validUntilDate}T${validUntilTime}:00`).getTime() - WIB_OFFSET_MS,
    ).toISOString();
    if (validFrom >= validUntil) {
      setError("Tanggal mulai harus sebelum tanggal berakhir");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        code: code.trim(),
        name: name.trim(),
        discount_percent: percent,
        min_purchase_amount: min,
        max_uses: maxUsesParsed,
        valid_from: validFrom,
        valid_until: validUntil,
      };

      let res: Response;
      if (mode === "edit" && voucherId) {
        const updatePayload = {
          name: name.trim(),
          discount_percent: percent,
          min_purchase_amount: min,
          max_uses: maxUsesParsed,
          valid_from: validFrom,
          valid_until: validUntil,
        };
        res = await fetch(`/api/admin/vouchers/${voucherId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });
      } else {
        res = await fetch("/api/admin/vouchers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan voucher");
      }

      router.push("/admin/vouchers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan voucher");
    } finally {
      setSaving(false);
    }
  };

  const isEditCodeLocked = mode === "edit";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <AdminPageHeader
          title={mode === "edit" ? "Edit Voucher" : "Tambah Voucher"}
          subtitle={
            mode === "edit"
              ? "Ubah data voucher"
              : "Buat kode voucher / kode promo baru"
          }
          backHref="/admin/vouchers"
          backLabel="Kembali"
          className="mb-6"
        />

        {error && (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            <p className="mt-4 text-sm text-slate-500">Memuat voucher...</p>
          </div>
        ) : (
          <>
            <AdminSection title="Informasi Voucher">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kode Voucher
                  </label>
                  <AdminInput
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: HEMAT10"
                    disabled={isEditCodeLocked}
                    className={isEditCodeLocked ? "bg-slate-100 opacity-60" : ""}
                  />
                  {isEditCodeLocked && (
                    <p className="mt-1 text-xs text-slate-400">
                      Kode tidak dapat diubah setelah dibuat
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nama Voucher
                  </label>
                  <AdminInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Diskon Lebaran"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Diskon (persen, 1-100)
                  </label>
                  <AdminInput type="text" inputMode="numeric"
                    value={discountPercent}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      setDiscountPercent(v.slice(0, 3));
                    }}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Minimal Belanja (0 = tanpa minimal)
                  </label>
                  <AdminInput type="text" inputMode="numeric"
                    value={minPurchase}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      setMinPurchase(v);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Batas Pemakaian (kosongkan = tanpa batas)
                  </label>
                  <AdminInput type="text" inputMode="numeric"
                    value={maxUses}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      setMaxUses(v.slice(0, 6));
                    }}
                    placeholder="100"
                  />
                </div>
              </div>
            </AdminSection>

            <AdminSection title="Periode Berlaku" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tanggal Mulai
                  </label>
                  <AdminInput
                    type="date"
                    value={validFromDate}
                    onChange={(e) => setValidFromDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Jam Mulai
                  </label>
                  <AdminInput
                    type="time"
                    value={validFromTime}
                    onChange={(e) => setValidFromTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tanggal Berakhir
                  </label>
                  <AdminInput
                    type="date"
                    value={validUntilDate}
                    onChange={(e) => setValidUntilDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Jam Berakhir
                  </label>
                  <AdminInput
                    type="time"
                    value={validUntilTime}
                    onChange={(e) => setValidUntilTime(e.target.value)}
                  />
                </div>
              </div>
            </AdminSection>

            <div className="mt-6 flex gap-4">
              <AdminButton
                variant="secondary"
                onClick={() => router.push("/admin/vouchers")}
              >
                Batal
              </AdminButton>
              <AdminButton
                variant="success"
                onClick={handleSave}
                loading={saving}
                disabled={saving}
              >
                {mode === "edit" ? "Simpan Perubahan" : "Simpan Voucher"}
              </AdminButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
