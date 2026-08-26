"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface NotificationOrder {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number;
  created_at: string;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  return `${days}h lalu`;
}

export function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [orders, setOrders] = useState<NotificationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/notifications", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setCount(data.count ?? 0);
          setOrders(data.orders ?? []);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
      >
        <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">
          {loading ? "..." : count}
        </span>
        Notifikasi
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Pesanan Baru</p>
            <p className="text-xs text-slate-500">Menunggu diproses</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                Memuat...
              </div>
            ) : orders.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                Tidak ada pesanan baru
              </div>
            ) : (
              orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/admin/orders/${order.id}`);
                  }}
                  className="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 last:border-b-0"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                    📦
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {order.customer_name || "Tanpa Nama"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Rp {order.total_amount.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {formatTimeAgo(order.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>
          {count > 0 && (
            <div className="border-t border-slate-100 px-4 py-2.5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push("/admin/orders?fulfillment_status=new&payment_status=paid");
                }}
                className="w-full text-center text-xs font-medium text-sky-600 hover:text-sky-700"
              >
                Lihat semua pesanan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
