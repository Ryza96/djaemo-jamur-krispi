"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Inbox, XCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/patterns/AdminPageHeader";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminEmptyLayout } from "@/components/admin/patterns/AdminEmptyLayout";
import type { PartnerRow } from "@/lib/services/partner.service";
import type { PartnerStatus } from "@/components/partner/PartnerAuthProvider";

const STATUS_BADGE_MAP: Record<
  PartnerStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  PENDING_REVIEW: "warning",
  RESELLER_ACTIVE: "success",
  DROPSHIPPER_ACTIVE: "success",
  REJECTED: "danger",
  SUSPENDED: "neutral",
};

const STATUS_LABEL: Record<PartnerStatus, string> = {
  PENDING_REVIEW: "Pending Review",
  RESELLER_ACTIVE: "Reseller Active",
  DROPSHIPPER_ACTIVE: "Dropshipper Active",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

const STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "", label: "Semua Status" },
  { value: "RESELLER_ACTIVE", label: "Reseller Active" },
  { value: "DROPSHIPPER_ACTIVE", label: "Dropshipper Active" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
];

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

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_REVIEW");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actingKey, setActingKey] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const res = await fetch(`/api/admin/partners${query}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat data partner");
      }
      setPartners(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data partner");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleReview = async (
    partner: PartnerRow,
    action: "approve" | "reject",
  ) => {
    const key = `${partner.id}:${action}`;
    setActingKey(key);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses review partner");
      }
      fetchPartners();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Gagal memproses review partner",
      );
    } finally {
      setActingKey(null);
    }
  };

  const emptyTitle =
    statusFilter === "PENDING_REVIEW" ? "Tidak Ada Pendaftar Pending" : "Tidak Ada Partner";
  const emptyDescription =
    statusFilter === "PENDING_REVIEW"
      ? "Semua pendaftaran partner sudah direview."
      : "Belum ada partner dengan status ini.";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <AdminPageHeader
          title="Partner"
          subtitle="Review pendaftaran reseller & dropshipper"
          action={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter status partner"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            <p className="text-sm text-slate-500">Memuat data partner...</p>
          </div>
        ) : error ? (
          <AdminEmptyLayout
            variant="error"
            icon={<XCircle className="h-16 w-16" />}
            title="Gagal Memuat Data"
            description={error}
          />
        ) : partners.length === 0 ? (
          <AdminEmptyLayout
            variant="empty"
            icon={<Inbox className="h-16 w-16" />}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Tipe</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Saluran Jual</th>
                  <th className="px-4 py-3 font-medium">Didaftarkan</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {partners.map((partner) => {
                  const rowBusy = actingKey?.startsWith(`${partner.id}:`) ?? false;
                  return (
                    <tr key={partner.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <span className="font-mono font-semibold text-slate-900">
                          {partner.username}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{partner.full_name}</td>
                      <td className="px-4 py-4 capitalize text-slate-700">
                        {partner.partner_type}
                      </td>
                      <td className="px-4 py-4">
                        <AdminBadge variant={STATUS_BADGE_MAP[partner.status]} size="sm">
                          {STATUS_LABEL[partner.status]}
                        </AdminBadge>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{partner.phone}</td>
                      <td className="px-4 py-4 text-slate-600">{partner.email ?? "—"}</td>
                      <td className="px-4 py-4 text-slate-600">
                        {(partner.sales_channels ?? []).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        {formatDateTime(partner.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        {partner.status === "PENDING_REVIEW" ? (
                          <div className="flex items-center gap-2">
                            <AdminButton
                              variant="success"
                              size="sm"
                              className="cursor-pointer disabled:cursor-not-allowed"
                              loading={actingKey === `${partner.id}:approve`}
                              disabled={rowBusy}
                              onClick={() => handleReview(partner, "approve")}
                            >
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Approve
                              </span>
                            </AdminButton>
                            <AdminButton
                              variant="danger"
                              size="sm"
                              className="cursor-pointer disabled:cursor-not-allowed"
                              loading={actingKey === `${partner.id}:reject`}
                              disabled={rowBusy}
                              onClick={() => handleReview(partner, "reject")}
                            >
                              <span className="inline-flex items-center gap-1">
                                <XCircle className="h-4 w-4" />
                                Reject
                              </span>
                            </AdminButton>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
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
