"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Calendar, Clock, CheckCircle, XCircle, Copy } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/patterns/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminEmptyLayout } from "@/components/admin/patterns/AdminEmptyLayout";
import { usePromos } from "@/hooks/use-promos";
import { formatPrice } from "@/lib/utils";
import type { PromoListItem, PromoStatus } from "@/lib/services/promo.service";

type StatusTab = {
  id: PromoStatus | "all";
  label: string;
  icon: React.ReactNode;
};

const STATUS_TABS: StatusTab[] = [
  { id: "all", label: "Semua Promo", icon: <Inbox className="h-4 w-4" /> },
  { id: "upcoming", label: "Akan Datang", icon: <Calendar className="h-4 w-4" /> },
  { id: "active", label: "Aktif", icon: <Clock className="h-4 w-4" /> },
  { id: "ended", label: "Berakhir", icon: <CheckCircle className="h-4 w-4" /> },
  { id: "cancelled", label: "Dibatalkan", icon: <XCircle className="h-4 w-4" /> },
];

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

function PromoCard({ promo, onView, onDuplicate }: { promo: PromoListItem; onView: (id: string) => void; onDuplicate: (promo: PromoListItem) => void }) {
  const canDuplicate = promo.status !== "cancelled";

  return (
    <div
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md cursor-pointer"
      onClick={() => onView(promo.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-900">{promo.name}</h3>
        <AdminBadge variant={STATUS_BADGE_MAP[promo.status]} size="sm">
          {STATUS_TABS.find((t) => t.id === promo.status)?.label || promo.status}
        </AdminBadge>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>
            {formatDate(promo.start_date)} {formatTime(promo.start_date)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>
            {formatDate(promo.end_date)} {formatTime(promo.end_date)}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs font-medium text-slate-500 mb-2">
          {promo.promo_products.length} Produk
        </p>
        <div className="flex flex-wrap gap-2">
          {promo.promo_products.slice(0, 3).map((pp) => (
            <span
              key={pp.id}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
            >
              {pp.products?.name || pp.product_id}
            </span>
          ))}
          {promo.promo_products.length > 3 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
              +{promo.promo_products.length - 3} lainnya
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="text-xs font-medium text-slate-500 mb-2">Harga Promo</p>
        <div className="flex flex-wrap gap-2">
          {promo.promo_products.slice(0, 3).map((pp) => (
            <span
              key={pp.id}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
            >
              {pp.products?.name || pp.product_id}: {formatPrice(pp.promo_price)}
            </span>
          ))}
          {promo.promo_products.length > 3 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
              +{promo.promo_products.length - 3} lainnya
            </span>
          )}
        </div>
      </div>

      {canDuplicate && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(promo);
            }}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
          >
            <Copy className="h-4 w-4" />
            Duplikat
          </button>
        </div>
      )}
    </div>
  );
}

function PromoTableRow({ promo, onView, onDuplicate }: { promo: PromoListItem; onView: (id: string) => void; onDuplicate: (promo: PromoListItem) => void }) {
  const canDuplicate = promo.status !== "cancelled";

  return (
    <tr
      className="cursor-pointer hover:bg-slate-50 transition"
      onClick={() => onView(promo.id)}
    >
      <td className="px-4 py-4">
        <span className="font-medium text-slate-900">{promo.name}</span>
      </td>
      <td className="px-4 py-4">
        <AdminBadge variant={STATUS_BADGE_MAP[promo.status]} size="sm">
          {STATUS_TABS.find((t) => t.id === promo.status)?.label || promo.status}
        </AdminBadge>
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">
        {formatDate(promo.start_date)} {formatTime(promo.start_date)}
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">
        {formatDate(promo.end_date)} {formatTime(promo.end_date)}
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">
        {promo.promo_products.length} Produk
      </td>
      <td className="px-4 py-4">
        {canDuplicate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(promo);
            }}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition"
          >
            <Copy className="h-4 w-4" />
            Duplikat
          </button>
        )}
      </td>
    </tr>
  );
}

export default function AdminPromosPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PromoStatus | "all">("all");
  const { promos, loading, error } = usePromos(activeTab === "all" ? undefined : activeTab);

  const handleView = (id: string) => {
    router.push(`/admin/promos/${encodeURIComponent(id)}`);
  };

  const handleAdd = () => {
    router.push("/admin/promos/new");
  };

  const handleDuplicate = (promo: PromoListItem) => {
    const params = new URLSearchParams();
    params.set("name", `${promo.name} (Salinan)`);
    params.set("products", JSON.stringify(
      promo.promo_products.map((pp) => ({
        product_id: pp.product_id,
        promo_price: pp.promo_price,
        product_name: pp.products?.name || pp.product_id,
      }))
    ));
    router.push(`/admin/promos/new?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <AdminPageHeader
          title="Promo"
          subtitle="Kelola promo produk"
          action={
            <AdminButton onClick={handleAdd} variant="success">
              + Tambah Promo
            </AdminButton>
          }
          className="mb-6"
        />

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            <p className="mt-4 text-sm text-slate-500">Memuat data promo...</p>
          </div>
        ) : error ? (
          <AdminEmptyLayout
            variant="error"
            icon={<XCircle className="h-16 w-16" />}
            title="Gagal Memuat Data"
            description={error}
          />
        ) : promos.length === 0 ? (
          <AdminEmptyLayout
            variant="empty"
            icon={<Inbox className="h-16 w-16" />}
            title="Tidak Ada Promo"
            description={`Belum ada promo dengan status "${STATUS_TABS.find((t) => t.id === activeTab)?.label}".`}
          />
        ) : (
          <>
            <div className="hidden md:block rounded-3xl bg-white shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nama Promo</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Mulai</th>
                    <th className="px-4 py-3 font-medium">Berakhir</th>
                    <th className="px-4 py-3 font-medium">Produk</th>
                    <th className="px-4 py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {promos.map((promo) => (
                    <PromoTableRow key={promo.id} promo={promo} onView={handleView} onDuplicate={handleDuplicate} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">
              {promos.map((promo) => (
                <PromoCard key={promo.id} promo={promo} onView={handleView} onDuplicate={handleDuplicate} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
