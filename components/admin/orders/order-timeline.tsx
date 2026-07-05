"use client";

import { useOrderTimeline } from "@/hooks/use-order-timeline";
import type { TimelineEntry } from "@/hooks/use-order-timeline";

interface OrderTimelineProps {
  orderId: string;
}

interface EventStyle {
  cls: string;
  dotCls: string;
}

const EVENT_STYLES: Record<string, EventStyle> = {
  "order.created": {
    cls: "border-slate-300 bg-slate-100 text-slate-600",
    dotCls: "bg-slate-400",
  },
  "snap.created": {
    cls: "border-slate-300 bg-slate-100 text-slate-600",
    dotCls: "bg-slate-400",
  },
  "snap.retry": {
    cls: "border-amber-300 bg-amber-100 text-amber-600",
    dotCls: "bg-amber-500",
  },
  "callback.received": {
    cls: "border-slate-300 bg-slate-100 text-slate-600",
    dotCls: "bg-slate-400",
  },
  "status.changed": {
    cls: "border-slate-300 bg-slate-100 text-slate-600",
    dotCls: "bg-slate-400",
  },
  "callback.skipped": {
    cls: "border-slate-300 bg-slate-100 text-slate-600",
    dotCls: "bg-slate-400",
  },
  "callback.invalid": {
    cls: "border-rose-300 bg-rose-100 text-rose-600",
    dotCls: "bg-rose-500",
  },
  "order.rollback": {
    cls: "border-rose-300 bg-rose-100 text-rose-600",
    dotCls: "bg-rose-500",
  },
  "order.processing": {
    cls: "border-blue-300 bg-blue-100 text-blue-600",
    dotCls: "bg-blue-500",
  },
  "order.confirmed": {
    cls: "border-blue-300 bg-blue-100 text-blue-600",
    dotCls: "bg-blue-500",
  },
  "order.shipped": {
    cls: "border-orange-300 bg-orange-100 text-orange-600",
    dotCls: "bg-orange-500",
  },
  "order.completed": {
    cls: "border-emerald-300 bg-emerald-100 text-emerald-600",
    dotCls: "bg-emerald-500",
  },
  "order.cancelled": {
    cls: "border-rose-300 bg-rose-100 text-rose-600",
    dotCls: "bg-rose-500",
  },
  "payment.manual_confirm": {
    cls: "border-emerald-300 bg-emerald-100 text-emerald-600",
    dotCls: "bg-emerald-500",
  },
  "order.notes_updated": {
    cls: "border-slate-300 bg-slate-100 text-slate-600",
    dotCls: "bg-slate-400",
  },
  "shipment.created": {
    cls: "border-indigo-300 bg-indigo-100 text-indigo-600",
    dotCls: "bg-indigo-500",
  },
  "shipment.picking_up": {
    cls: "border-blue-300 bg-blue-100 text-blue-600",
    dotCls: "bg-blue-500",
  },
  "shipment.dropping_off": {
    cls: "border-indigo-300 bg-indigo-100 text-indigo-600",
    dotCls: "bg-indigo-500",
  },
  "shipment.in_transit": {
    cls: "border-amber-300 bg-amber-100 text-amber-600",
    dotCls: "bg-amber-500",
  },
  "shipment.delivered": {
    cls: "border-emerald-300 bg-emerald-100 text-emerald-600",
    dotCls: "bg-emerald-500",
  },
  "shipment.cancelled": {
    cls: "border-rose-300 bg-rose-100 text-rose-600",
    dotCls: "bg-rose-500",
  },
  "shipment.retry": {
    cls: "border-orange-300 bg-orange-100 text-orange-600",
    dotCls: "bg-orange-500",
  },
};

const EVENT_LABELS: Record<string, string> = {
  "order.created": "Order Created",
  "snap.created": "Snap Created",
  "snap.retry": "Snap Retry",
  "callback.received": "Callback Received",
  "status.changed": "Status Changed",
  "callback.skipped": "Callback Skipped",
  "callback.invalid": "Invalid Callback",
  "order.rollback": "Rollback",
  "order.processing": "Processing",
  "order.confirmed": "Confirmed",
  "order.shipped": "Shipped",
  "order.completed": "Completed",
  "order.cancelled": "Cancelled",
  "payment.manual_confirm": "Payment Confirmed",
  "order.notes_updated": "Notes Updated",
  "shipment.created": "Shipment Created",
  "shipment.picking_up": "Picked Up",
  "shipment.dropping_off": "Dropping Off",
  "shipment.in_transit": "In Transit",
  "shipment.delivered": "Delivered",
  "shipment.cancelled": "Cancelled",
  "shipment.retry": "Retry",
};

function getEventStyle(event: string): EventStyle {
  return EVENT_STYLES[event] ?? EVENT_STYLES["order.created"];
}

function getEventLabel(event: string): string {
  return EVENT_LABELS[event] ?? event;
}

function getEventDescription(entry: TimelineEntry): string {
  const event = entry.event;
  const meta = entry.metadata as Record<string, string> | null;

  switch (event) {
    case "order.created":
      return "Customer membuat pesanan.";
    case "snap.created":
      return meta?.snap_token
        ? "Midtrans Snap berhasil dibuat."
        : "Midtrans Snap dibuat.";
    case "snap.retry":
      return "Percobaan ulang pembuatan Snap.";
    case "callback.received":
      return "Callback dari Midtrans diterima.";
    case "status.changed":
      return `Status berubah dari "${entry.from_status ?? "-"}" ke "${entry.to_status}".`;
    case "callback.skipped":
      return "Callback dilewati (sudah diproses sebelumnya).";
    case "callback.invalid":
      return "Callback tidak valid.";
    case "order.rollback":
      return "Rollback stok karena pembayaran gagal.";
    case "order.processing":
      return "Pesanan mulai diproses oleh admin.";
    case "order.confirmed":
      return "Pesanan dikonfirmasi oleh admin.";
    case "order.shipped":
      return meta?.waybill_id
        ? `Pesanan dikirim. Resi: ${meta.waybill_id}`
        : "Pesanan dikirim.";
    case "order.completed":
      return "Pesanan selesai.";
    case "order.cancelled":
      return meta?.cancellation_reason
        ? `Pesanan dibatalkan. Alasan: ${meta.cancellation_reason}`
        : "Pesanan dibatalkan.";
    case "payment.manual_confirm":
      return "Pembayaran dikonfirmasi secara manual oleh admin.";
    case "order.notes_updated":
      return "Catatan admin diperbarui.";
    case "shipment.created":
      return meta?.shipment_id
        ? `Resi Biteship dibuat. ID: ${meta.shipment_id}`
        : "Resi Biteship dibuat.";
    case "shipment.picking_up":
      return "Kurir mengambil paket dari pengirim.";
    case "shipment.dropping_off":
      return "Paket sedang dalam proses dropping off.";
    case "shipment.in_transit":
      return "Paket dalam perjalanan menuju tujuan.";
    case "shipment.delivered":
      return "Paket berhasil diterima oleh penerima.";
    case "shipment.cancelled":
      return "Pengiriman dibatalkan.";
    case "shipment.retry":
      return "Pengiriman dijadwalkan ulang.";
    default:
      return `Event: ${event}`;
  }
}

function TimelineIcon({ event }: { event: string }) {
  const cls = "h-5 w-5";

  switch (event) {
    case "order.created":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      );
    case "snap.created":
    case "snap.retry":
    case "callback.received":
    case "callback.skipped":
    case "callback.invalid":
    case "payment.manual_confirm":
    case "status.changed":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
      );
    case "order.processing":
    case "order.confirmed":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      );
    case "order.shipped":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      );
    case "order.completed":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "order.cancelled":
    case "order.rollback":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "order.notes_updated":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75v10.5m-7.5-3h15" />
        </svg>
      );
    case "shipment.created":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 2.25h16.5M3.75 13.5h16.5M3.75 15.75h16.5M3.75 18h16.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 6.75h13.5A2.25 2.25 0 0 1 21 9v10.5A2.25 2.25 0 0 1 18.75 21.75H5.25A2.25 2.25 0 0 1 3 19.5V9a2.25 2.25 0 0 1 2.25-2.25Z" />
        </svg>
      );
    case "shipment.picking_up":
    case "shipment.droping_off":
    case "shipment.in_transit":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      );
    case "shipment.delivered":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "shipment.cancelled":
    case "shipment.retry":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDateKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getDateGroupLabel(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (target.getTime() === today.getTime()) return "Hari Ini";
  if (target.getTime() === yesterday.getTime()) return "Kemarin";
  return formatDate(dateStr);
}

function groupByDate(entries: TimelineEntry[]): Map<string, TimelineEntry[]> {
  const groups = new Map<string, TimelineEntry[]>();

  for (const entry of entries) {
    const key = getDateKey(entry.created_at);
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  const sorted = new Map(
    [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0])),
  );

  return sorted;
}

function TimelineSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-5 w-32 rounded bg-slate-200" />
      <div className="ml-6 space-y-4 border-l-2 border-slate-200 pl-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-slate-200" />
              <div className="h-4 w-28 rounded bg-slate-200" />
            </div>
            <div className="ml-7 h-3 w-20 rounded bg-slate-100" />
            <div className="ml-7 h-3 w-48 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const { entries, loading, error, refresh } = useOrderTimeline(orderId);

  if (loading) return <TimelineSkeleton />;

  if (error) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm shadow-slate-200">
        <p className="mb-3 text-sm text-rose-600">{error}</p>
        <button
          onClick={refresh}
          className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm shadow-slate-200">
        <p className="text-sm text-slate-500">Belum ada aktivitas.</p>
      </div>
    );
  }

  const grouped = groupByDate(entries);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Activity Timeline
      </h2>

      <div className="space-y-8">
        {[...grouped.entries()].map(([dateKey, group]) => (
          <div key={dateKey}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {getDateGroupLabel(group[0].created_at)}
            </h3>

            <div className="relative ml-2.5 space-y-6">
              <div className="absolute left-[7px] top-2 h-[calc(100%-8px)] w-0.5 bg-slate-200" />

              {group.map((entry) => {
                const style = getEventStyle(entry.event);
                return (
                  <div key={entry.id} className="relative flex items-start gap-4">
                    <div
                      className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${style.dotCls} text-white`}
                    >
                      <TimelineIcon event={entry.event} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.2em] ${style.cls}`}
                        >
                          {getEventLabel(entry.event)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {formatDate(entry.created_at)} &middot;{" "}
                        {formatTime(entry.created_at)}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {getEventDescription(entry)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
