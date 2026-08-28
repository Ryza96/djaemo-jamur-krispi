"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Pencil, Power, XCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/patterns/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminEmptyLayout } from "@/components/admin/patterns/AdminEmptyLayout";
import { useVouchers } from "@/hooks/use-vouchers";
import { formatPrice } from "@/lib/utils";
import {
  VOUCHER_STATUS_LABEL,
  type VoucherStatus,
} from "@/lib/services/voucher-engine";
import type { VoucherListItem } from "@/lib/services/voucher.service";

const STATUS_BADGE_MAP: Record<VoucherStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  active: "success",
  upcoming: "info",
  inactive: "neutral",
  expired: "danger",
  exhausted: "warning",
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function AdminVouchersPage() {
  const router = useRouter();
  const { vouchers, loading, error, refresh } = useVouchers();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleToggle = async (voucher: VoucherListItem) => {
    setTogglingId(voucher.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/vouchers/${voucher.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !voucher.is_active }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah status voucher");
      }
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal mengubah status voucher");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <AdminPageHeader
          title="Voucher"
          subtitle="Kelola kode voucher / kode promo checkout"
          action={
            <AdminButton
              onClick={() => router.push("/admin/vouchers/new")}
              variant="success"
            >
              + Tambah Voucher
            </AdminButton>
          }
          className="mb-6"
        />

        {actionError && (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            <p className="mt-4 text-sm text-slate-500">Memuat data voucher...</p>
          </div>
        ) : error ? (
          <AdminEmptyLayout
            variant="error"
            icon={<XCircle className="h-16 w-16" />}
            title="Gagal Memuat Data"
            description={error}
          />
        ) : vouchers.length === 0 ? (
          <AdminEmptyLayout
            variant="empty"
            icon={<Inbox className="h-16 w-16" />}
            title="Tidak Ada Voucher"
            description="Buat kode voucher pertama untuk diskon checkout."
            action={
              <AdminButton
                onClick={() => router.push("/admin/vouchers/new")}
                variant="success"
              >
                + Tambah Voucher
              </AdminButton>
            }
          />
        ) : (
          <div className="rounded-3xl bg-white shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Kode</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Diskon</th>
                  <th className="px-4 py-3 font-medium">Min. Belanja</th>
                  <th className="px-4 py-3 font-medium">Pemakaian</th>
                  <th className="px-4 py-3 font-medium">Berlaku</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {vouchers.map((voucher) => {
                  const usageLimit = voucher.max_uses ?? "∞";
                  const remaining =
                    voucher.max_uses === null
                      ? "∞"
                      : Math.max(voucher.max_uses - voucher.current_uses, 0);
                  return (
                    <tr key={voucher.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-4">
                        <span className="font-mono font-semibold text-slate-900">
                          {voucher.code}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{voucher.name}</td>
                      <td className="px-4 py-4">
                        <AdminBadge variant={STATUS_BADGE_MAP[voucher.status]} size="sm">
                          {VOUCHER_STATUS_LABEL[voucher.status]}
                        </AdminBadge>
                      </td>
                      <td className="px-4 py-4 font-medium text-emerald-700">
                        {voucher.discount_percent}%
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {voucher.min_purchase_amount > 0
                          ? formatPrice(voucher.min_purchase_amount)
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {voucher.current_uses} / {usageLimit} (sisa {remaining})
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        <div>{formatDateTime(voucher.valid_from)}</div>
                        <div className="text-slate-400">
                          — {formatDateTime(voucher.valid_until)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              router.push(`/admin/vouchers/new?mode=edit&id=${voucher.id}`)
                            }
                            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggle(voucher)}
                            disabled={togglingId === voucher.id}
                            className={`inline-flex items-center gap-1 text-sm transition disabled:opacity-50 ${
                              voucher.is_active
                                ? "text-amber-600 hover:text-amber-700"
                                : "text-emerald-600 hover:text-emerald-700"
                            }`}
                          >
                            <Power className="h-4 w-4" />
                            {voucher.is_active ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
