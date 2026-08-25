"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface OrderData {
  order_id: string;
  payment_status?: string;
  fulfillment_status?: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

type CustomerStatus =
  | "awaiting_payment"
  | "payment_failed"
  | "payment_expired"
  | "cancelled"
  | "paid"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered";

// Fulfillment values that all mean "order is being prepared".
const FULFILLMENT_PREPARING = [
  "packing",
  "waybill_created",
  "waiting_for_courier_pickup",
  "picked_up",
  "waiting_for_restock",
];

/**
 * Resolves the customer-facing view from BOTH payment_status and
 * fulfillment_status. An order whose payment is not settled must never be
 * presented as "Pembayaran Berhasil" — the old mapping applied payment
 * labels to the fulfillment field alone and showed unpaid/expired/failed
 * orders as paid.
 */
function resolveCustomerView(
  paymentRaw: string | undefined,
  fulfillmentRaw: string | undefined,
): CustomerStatus {
  const payment = (paymentRaw ?? "").toLowerCase();
  const fulfillment = (fulfillmentRaw ?? "").toLowerCase();

  switch (payment) {
    case "failed":
      return "payment_failed";
    case "expired":
      return "payment_expired";
    case "unpaid":
    case "pending":
      return fulfillment === "cancelled" ? "cancelled" : "awaiting_payment";
    case "paid":
      if (fulfillment === "cancelled") return "cancelled";
      if (fulfillment === "delivered") return "delivered";
      if (fulfillment === "shipped") return "shipped";
      if (fulfillment === "confirmed") return "confirmed";
      if (FULFILLMENT_PREPARING.includes(fulfillment)) return "preparing";
      // "new" or unknown fulfillment after successful payment
      return "paid";
    default:
      // Legacy/unknown payment status: derive from fulfillment progress,
      // falling back to "awaiting payment" instead of claiming success.
      if (fulfillment === "cancelled") return "cancelled";
      if (fulfillment === "delivered") return "delivered";
      if (fulfillment === "shipped") return "shipped";
      if (fulfillment === "confirmed") return "confirmed";
      if (FULFILLMENT_PREPARING.includes(fulfillment)) return "preparing";
      return "awaiting_payment";
  }
}

const STATUS_CONFIG: Record<
  CustomerStatus,
  { title: string; message: string; icon: string; color: string }
> = {
  awaiting_payment: {
    title: "Menunggu Pembayaran",
    message:
      "Pesanan Anda telah dibuat. Selesaikan pembayaran agar pesanan segera kami proses.",
    icon: "⏳",
    color: "text-amber-600",
  },
  payment_failed: {
    title: "Pembayaran Gagal",
    message:
      "Pembayaran Anda tidak berhasil. Silakan buat pesanan baru atau hubungi kami untuk bantuan.",
    icon: "⚠️",
    color: "text-red-600",
  },
  payment_expired: {
    title: "Pembayaran Kedaluwarsa",
    message:
      "Waktu pembayaran telah berakhir sehingga pesanan dibatalkan otomatis. Silakan buat pesanan baru.",
    icon: "🕒",
    color: "text-slate-600",
  },
  cancelled: {
    title: "Pesanan Dibatalkan",
    message: "Pesanan Anda telah dibatalkan. Hubungi kami jika ada pertanyaan.",
    icon: "❌",
    color: "text-red-600",
  },
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

export default function TrackOrderDetailPage() {
  const params = useParams();

  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError("Nomor pesanan tidak valid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}`
      );

      if (!res.ok) {
        if (res.status === 404) throw new Error("Pesanan tidak ditemukan.");
        throw new Error("Gagal memuat data pesanan.");
      }

      const json = await res.json();
      if (!json.success || !json.data) throw new Error("Data pesanan tidak valid.");

      setOrder(json.data as OrderData);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrder();
  }, [loadOrder]);

  function handleCopyOrderId() {
    if (!order?.order_id) return;
    navigator.clipboard.writeText(order.order_id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            <Button onClick={loadOrder} className="w-full">
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

  const customerStatus = resolveCustomerView(
    order.payment_status,
    order.fulfillment_status,
  );
  const statusConfig = STATUS_CONFIG[customerStatus];

  // Payment-pending / failed / expired / cancelled views are outside the
  // fulfillment timeline; indexOf returns -1 and the timeline is hidden.
  const currentTimelineIndex = TIMELINE_ORDER.indexOf(customerStatus);

  const CARD_STYLES: Partial<Record<CustomerStatus, string>> = {
    awaiting_payment: "border-amber-200 bg-amber-50",
    payment_failed: "border-red-200 bg-red-50",
    payment_expired: "border-slate-200 bg-slate-50",
    cancelled: "border-red-200 bg-red-50",
    delivered: "border-green-200 bg-green-50",
  };
  const cardStyle =
    CARD_STYLES[customerStatus] ?? "border-primary/10 bg-white";

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
          className={`rounded-3xl border p-6 text-center shadow-sm sm:p-8 ${cardStyle}`}
        >
          <div className={`text-4xl ${statusConfig.color}`}>{statusConfig.icon}</div>
          <h2 className={`mt-3 text-xl font-semibold ${statusConfig.color}`}>
            {statusConfig.title}
          </h2>
          <p className="mt-2 text-sm text-muted">{statusConfig.message}</p>
        </div>

        <div className="rounded-3xl border border-primary/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-muted">Nomor Pesanan</p>
              <p className="truncate font-mono text-sm font-semibold text-foreground">
                {order.order_id}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyOrderId}
              className="shrink-0 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              {copied ? "Tersalin!" : "Salin Nomor Pesanan"}
            </button>
          </div>
        </div>

        {currentTimelineIndex !== -1 && (
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
        )}

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
            onClick={loadOrder}
            disabled={loading}
          >
            {loading ? "Memuat..." : "Muat Ulang Status"}
          </Button>
          <Button variant="outline" className="w-full" href="/track-order">
            Lacak Pesanan Lain
          </Button>
          <Button variant="outline" className="w-full" href="/">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </Section>
  );
}
