"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Pencil } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/patterns/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminSection } from "@/components/admin/patterns/AdminSection";
import { AdminKeyValue } from "@/components/admin/ui/AdminKeyValue";
import { AdminEmptyLayout } from "@/components/admin/patterns/AdminEmptyLayout";
import { usePromoDetail } from "@/hooks/use-promo-detail";
import { formatPrice } from "@/lib/utils";
import type { PromoStatus } from "@/lib/services/promo.service";

const STATUS_LABELS: Record<PromoStatus, string> = {
  upcoming: "Akan Datang",
  active: "Aktif",
  ended: "Berakhir",
  cancelled: "Dibatalkan",
};

const STATUS_BADGE_MAP: Record<PromoStatus, "info" | "success" | "neutral" | "danger"> = {
  upcoming: "info",
  active: "success",
  ended: "neutral",
  cancelled: "danger",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function PromoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { promo, loading, error, cancelPromo } = usePromoDetail(id);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    const result = await cancelPromo();
    setCancelling(false);
    setConfirmCancel(false);

    if (!result.success) {
      alert(result.error || "Gagal membatalkan promo");
    }
  };

  const handleDuplicate = () => {
    if (!promo) return;
    router.push(`/admin/promos/new?mode=duplicate&id=${promo.id}`);
  };

  const handleEdit = () => {
    if (!promo) return;
    router.push(`/admin/promos/new?mode=edit&id=${promo.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            <p className="mt-4 text-sm text-slate-500">Memuat data promo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !promo) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
          <AdminEmptyLayout
            variant="error"
            title="Promo Tidak Ditemukan"
            description={error || "Data promo tidak dapat ditemukan"}
            action={
              <AdminButton onClick={() => router.push("/admin/promos")}>
                Kembali ke Daftar Promo
              </AdminButton>
            }
          />
        </div>
      </div>
    );
  }

  const canCancel = promo.status === "upcoming" || promo.status === "active";
  const canEdit = !promo.cancelled_at;
  const canDuplicate = promo.status !== "cancelled";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <AdminPageHeader
          title={promo.name}
          subtitle="Detail promo"
          backHref="/admin/promos"
          badges={
            <AdminBadge variant={STATUS_BADGE_MAP[promo.status]} size="lg">
              {STATUS_LABELS[promo.status]}
            </AdminBadge>
          }
          className="mb-6"
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <AdminSection title="Informasi Promo">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminKeyValue label="Nama Promo" value={promo.name} />
                <AdminKeyValue
                  label="Status"
                  value={
                    <AdminBadge variant={STATUS_BADGE_MAP[promo.status]}>
                      {STATUS_LABELS[promo.status]}
                    </AdminBadge>
                  }
                />
                <AdminKeyValue
                  label="Tanggal Mulai"
                  value={`${formatDate(promo.start_date)} ${formatTime(promo.start_date)}`}
                />
                <AdminKeyValue
                  label="Tanggal Berakhir"
                  value={`${formatDate(promo.end_date)} ${formatTime(promo.end_date)}`}
                />
                <AdminKeyValue
                  label="Dibuat Pada"
                  value={formatDate(promo.created_at)}
                />
                {promo.cancelled_at && (
                  <AdminKeyValue
                    label="Dibatalkan Pada"
                    value={formatDate(promo.cancelled_at)}
                  />
                )}
              </div>
            </AdminSection>

            <AdminSection title={`Produk Promo (${promo.promo_products.length})`}>
              <div className="space-y-3">
                {promo.promo_products.map((pp) => (
                  <div
                    key={pp.id}
                    className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {pp.products?.name || pp.product_id}
                      </p>
                      <p className="text-sm text-slate-500">
                        Harga Normal: {formatPrice(pp.products?.price || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        {formatPrice(pp.promo_price)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Hemat {formatPrice((pp.products?.price || 0) - pp.promo_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AdminSection>
          </div>

          <div className="space-y-6">
            <AdminSection title="Aksi">
              <div className="space-y-3">
                {canEdit && (
                  <AdminButton
                    variant="secondary"
                    onClick={handleEdit}
                    className="w-full"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Promo
                  </AdminButton>
                )}

                {canDuplicate && (
                  <AdminButton
                    variant="secondary"
                    onClick={handleDuplicate}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplikat Promo
                  </AdminButton>
                )}

                {canCancel && (
                  <>
                    {confirmCancel ? (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600">
                          Apakah Anda yakin ingin membatalkan promo ini? Promo yang
                          dibatalkan tidak dapat diaktifkan kembali.
                        </p>
                        <div className="flex gap-2">
                          <AdminButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirmCancel(false)}
                          >
                            Tidak
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            size="sm"
                            onClick={handleCancel}
                            loading={cancelling}
                            disabled={cancelling}
                          >
                            Ya, Batalkan
                          </AdminButton>
                        </div>
                      </div>
                    ) : (
                      <AdminButton
                        variant="danger"
                        onClick={() => setConfirmCancel(true)}
                        className="w-full"
                      >
                        Batalkan Promo
                      </AdminButton>
                    )}
                  </>
                )}

                {!canCancel && !canDuplicate && (
                  <p className="text-sm text-slate-500">
                    {promo.status === "ended"
                      ? "Promo ini sudah berakhir."
                      : "Promo ini sudah dibatalkan."}
                  </p>
                )}

                {!canCancel && canDuplicate && (
                  <p className="text-sm text-slate-500">
                    Promo ini sudah berakhir dan tidak dapat dibatalkan.
                  </p>
                )}
              </div>
            </AdminSection>

            <AdminSection title="Ringkasan">
              <div className="space-y-2">
                <AdminKeyValue
                  label="Jumlah Produk"
                  value={`${promo.promo_products.length} produk`}
                />
              </div>
            </AdminSection>
          </div>
        </div>
      </div>
    </div>
  );
}
