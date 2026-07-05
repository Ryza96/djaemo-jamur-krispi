"use client";

import { useState, useCallback } from "react";

interface TrackingHistoryEntry {
  status: string;
  updated_at: string;
  description?: string;
}

interface TrackingData {
  status: string;
  waybillId: string;
  history: TrackingHistoryEntry[];
  lastTrackingAt: string | null;
}

const SHIPPING_STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-slate-100 text-slate-600",
  picking_up: "bg-blue-100 text-blue-700",
  dropping_off: "bg-indigo-100 text-indigo-700",
  in_transit: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  retry: "bg-orange-100 text-orange-700",
};

const SHIPPING_STATUS_DOTS: Record<string, string> = {
  confirmed: "bg-slate-400",
  picking_up: "bg-blue-500",
  dropping_off: "bg-indigo-500",
  in_transit: "bg-amber-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-500",
  retry: "bg-orange-500",
};

const SHIPPING_STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  picking_up: "Picking Up",
  dropping_off: "Dropping Off",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  retry: "Retry",
};

const TRACKING_STEP_ORDER: Record<string, number> = {
  confirmed: 0,
  picking_up: 1,
  dropping_off: 2,
  in_transit: 3,
  delivered: 4,
};

const TRACKING_STEP_LABELS: Record<string, string> = {
  picking_up: "Shipment Picked Up",
  dropping_off: "Dropping Off",
  in_transit: "In Transit",
  delivered: "Delivered",
};

interface TrackingPanelProps {
  orderId: string;
  waybillId: string | null;
  shippingStatus: string | null;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrackingPanel({ orderId, waybillId, shippingStatus }: TrackingPanelProps) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = useCallback(async () => {
    if (!waybillId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/tracking`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? "Gagal mengambil tracking.");
      }

      setTracking(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }, [orderId, waybillId]);

  const currentStatus = tracking?.status ?? shippingStatus;
  const styleKey = currentStatus?.toLowerCase() ?? "";

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Shipment Tracking
        </h2>
        {waybillId && (
          <button
            onClick={fetchTracking}
            disabled={loading}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        )}
      </div>

      {!waybillId ? (
        <p className="text-sm text-slate-400 italic">No waybill ID available.</p>
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-600">{error}</div>
      ) : (
        <>
          {/* Current Status Badge */}
          <div className="mb-4 flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${SHIPPING_STATUS_STYLES[styleKey] ?? "bg-slate-100 text-slate-600"}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${SHIPPING_STATUS_DOTS[styleKey] ?? "bg-slate-400"}`} />
              {SHIPPING_STATUS_LABELS[styleKey] ?? currentStatus}
            </span>
          </div>

          {tracking && (
            <>
              {/* Last Updated */}
              <div className="mb-4 text-xs text-slate-400">
                Last updated: {formatDateTime(tracking.lastTrackingAt)}
              </div>

              {/* Tracking Timeline */}
              {tracking.history.length > 0 && (
                <div className="relative ml-1.5 space-y-4">
                  <div className="absolute left-[5px] top-2 h-[calc(100%-8px)] w-0.5 bg-slate-200" />
                  {tracking.history.map((entry, idx) => {
                    const stepKey = entry.status;
                    const order = TRACKING_STEP_ORDER[stepKey] ?? -1;

                    return (
                      <div key={idx} className="relative flex items-start gap-3">
                        <div
                          className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ${
                            order >= TRACKING_STEP_ORDER.delivered
                              ? "bg-emerald-500"
                              : order >= TRACKING_STEP_ORDER.in_transit
                                ? "bg-amber-500"
                                : "bg-slate-400"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900">
                            {TRACKING_STEP_LABELS[stepKey] ?? stepKey}
                          </div>
                          {entry.description && (
                            <div className="mt-0.5 text-xs text-slate-500">
                              {entry.description}
                            </div>
                          )}
                          <div className="mt-0.5 text-xs text-slate-400">
                            {formatDateTime(entry.updated_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!tracking && !error && (
            <div className="text-sm text-slate-500">
              <p className="mb-2">
                Waybill: <span className="font-mono font-medium text-slate-700">{waybillId}</span>
              </p>
              <p className="text-xs text-slate-400 italic">
                Click Refresh to fetch latest tracking data.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
