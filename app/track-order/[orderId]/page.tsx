"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";
import { formatPrice } from "@/lib/utils";

const ORDER_STORAGE_KEY = "djaemo-last-order";

interface OrderItem {
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface OrderData {
  order_id: string;
  payment_status: string;
  fulfillment_status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

type CustomerStatus =
  | "paid"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

const CUSTOMER_STATUS_MAP: Record<string, CustomerStatus> = {
  unpaid: "paid",
  pending: "paid",
  paid: "paid",
  confirmed: "confirmed",
  packing: "preparing",
  waybill_created: "preparing",
  waiting_for_courier_pickup: "preparing",
  picked_up: "preparing",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  waiting_for_restock: "preparing",
};

const STATUS_CONFIG: Record<
  CustomerStatus,
  { title: string; message: string; icon: string; color: string }
> = {
  paid: {
    title: "Pembayaran Berhasil",
    message: "Pembayaran Anda telah kami terima dan pesanan sedang menunggu konfirmasi.",
    icon: "💰",
    color: "text-green-600",
  },
  confirmed: {
    title: "Pesanan Dikonfirmasi",
    message: "Pesanan Anda telah dikonfirmasi dan akan segera kami siapkan.",
    icon: "✅",
    color: "text-blue-600",
  },
  preparing: {
    title: "Pesanan Sedang Disiapkan",
    message: "Pesanan Anda sedang kami siapkan dan akan segera dikirim.",
    icon: "📦",
    color: "text-indigo-600",
  },
  shipped: {
    title: "Pesanan Telah Dikirim",
    message: "Pesanan Anda telah dikirim dan sedang menuju alamat tujuan.",
    icon: "🚚",
    color: "text-cyan-600",
  },
  delivered: {
    title: "Pesanan Telah Diterima",
    message: "Pesanan Anda telah berhasil diterima. Terima kasih telah berbelanja di D'Jaemo Jamur Krispi.",
    icon: "🎉",
    color: "text-green-600",
  },
  cancelled: {
    title: "Pesanan Dibatalkan",
    message: "Pesanan Anda telah dibatalkan. Hubungi kami jika ada pertanyaan.",
    icon: "❌",
    color: "text-red-600",
  },
};

const TIMELINE_STEPS: {
  key: CustomerStatus;
  label: string;
}[] = [
  { key: "paid", label: "Pembayaran Berhasil" },
  { key: "confirmed", label: "Pesanan Dikonfirmasi" },
  { key: "preparing", label: "Pesanan Sedang Disiapkan" },
  { key: "shipped", label: "Pesanan Telah Dikirim" },
  { key: "delivered", label: "Pesanan Telah Diterima" },
];

const TIMELINE_ORDER: CustomerStatus[] = [
  "paid",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(ORDER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.accessToken || null;
    }
  } catch {}
  return null;
}

function subscribeStoredToken(): () => void {
  return () => {};
}

export default function TrackOrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const orderId = params?.orderId as string;
  const tokenFromUrl = searchParams?.get("token");
  const storedToken = useSyncExternalStore(subscribeStoredToken, readStoredToken, () => null);
  const token = tokenFromUrl ?? storedToken;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!orderId) {
        setError("Nomor pesanan tidak valid.");
        setLoading(false);
        return;
      }

      if (!token) {
        setError("token-hilang");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`
        );

        if (!res.ok) {
          if (res.status === 401) throw new Error("Token akses diperlukan.");
          if (res.status === 403) throw new Error("Token akses tidak valid.");
          if (res.status === 404) throw new Error("Pesanan tidak ditemukan.");
          throw new Error("Gagal memuat data pesanan.");
        }

        const json = await res.json();
        if (!json.success || !json.data) throw new Error("Data pesanan tidak valid.");

        if (!cancelled) {
          setOrder(json.data as OrderData);
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [orderId, token]);

  function handleRefresh() {
    setLoading(true);
    setError(null);

    if (!orderId || !token) {
      setError("Token akses diperlukan.");
      setLoading(false);
      return;
    }

    fetch(`/api/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data pesanan.");
        return res.json();
      })
      .then((json) => {
        if (!json.success || !json.data) throw new Error("Data pesanan tidak valid.");
        setOrder(json.data as OrderData);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        setLoading(false);
      });
  }

  if (loading && !order) {
    return (
      <Section>
        <PageHeader title="Lacak Pesanan" description="Memuat data pesanan..." />
        <div className="flex flex-col items-center justify-center gap-6 py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted">Sedang mencari pesanan Anda...</p>
        </div>
      </Section>
    );
  }

  if (error === "token-hilang") {
    return (
      <Section>
        <PageHeader
          title="Token Diperlukan"
          description="Akses tracking memerlukan token akses yang valid."
        />
        <div className="mx-auto max-w-md rounded-3xl border border-primary/10 bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-sm text-muted">
            Token akses tidak ditemukan. Silakan masukkan nomor pesanan dan token akses Anda.
          </p>
          <div className="mt-8">
            <Button href="/track-order" className="w-full">
              Masukkan Token
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  if (error || !order) {
    return (
      <Section>
        <PageHeader
          title="Gagal Memuat"
          description="Terjadi kesalahan saat memuat data pesanan."
        />
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-sm text-muted">{error || "Data pesanan tidak tersedia."}</p>
          <div className="mt-8 flex flex-col gap-3">
            <Button onClick={handleRefresh} className="w-full">
              Coba Lagi
            </Button>
            <Button variant="outline" href="/track-order" className="w-full">
              Cari Ulang
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  const customerStatus = CUSTOMER_STATUS_MAP[order.fulfillment_status] ?? "paid";
  const statusConfig = STATUS_CONFIG[customerStatus];

  const currentTimelineIndex = TIMELINE_ORDER.indexOf(customerStatus);

  const firstItem = order.order_items[0];
  const remainingCount = order.order_items.length - 1;

  const formattedDate = lastUpdated
    ? lastUpdated.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  return (
    <Section>
      <PageHeader
        title="Lacak Pesanan"
        description={`Pesanan #${order.order_id}`}
      />

      <div className="mx-auto max-w-lg space-y-6">
        <div
          className={`rounded-3xl border p-6 text-center shadow-sm sm:p-8 ${
            customerStatus === "delivered"
              ? "border-green-200 bg-green-50"
              : customerStatus === "cancelled"
                ? "border-red-200 bg-red-50"
                : "border-primary/10 bg-white"
          }`}
        >
          <div className={`text-4xl ${statusConfig.color}`}>{statusConfig.icon}</div>
          <h2 className={`mt-3 text-xl font-semibold ${statusConfig.color}`}>
            {statusConfig.title}
          </h2>
          <p className="mt-2 text-sm text-muted">{statusConfig.message}</p>
        </div>

        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Status Pesanan</h3>
          <div className="space-y-0">
            {TIMELINE_STEPS.map((step, idx) => {
              const isCompleted = idx < currentTimelineIndex;
              const isCurrent = idx === currentTimelineIndex;

              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isCompleted || isCurrent
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 ${
                          isCompleted ? "bg-primary" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={`text-sm font-medium ${
                        isCompleted || isCurrent ? "text-foreground" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="mt-0.5 text-xs text-muted">{statusConfig.message}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Ringkasan Produk</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">
                {firstItem.product_name}
              </span>
              <span className="text-sm font-medium text-foreground">
                x{firstItem.quantity}
              </span>
            </div>
            {remainingCount > 0 && (
              <p className="text-xs text-muted">+ {remainingCount} produk lainnya</p>
            )}
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Total Pembayaran</span>
              <span className="text-lg font-semibold text-primary">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-center text-xs text-muted">
            Terakhir diperbarui: {formattedDate}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Memuat..." : "Muat Ulang Status"}
          </Button>
          <Button variant="outline" className="w-full" href="/track-order">
            Lacak Pesanan Lain
          </Button>
        </div>
      </div>
    </Section>
  );
}
