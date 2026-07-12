"use client";

import { AlertTriangle } from "lucide-react";

interface BannerItem {
  id: number;
  product_name: string;
  quantity: number;
  stock: number;
}

interface ActionBannerProps {
  fulfillmentStatus: string | null;
  items: BannerItem[];
  onResume?: () => void;
  loading?: boolean;
}

export function ActionBanner({ fulfillmentStatus, items, onResume, loading }: ActionBannerProps) {
  if (fulfillmentStatus !== "waiting_for_restock") return null;

  const itemsWithShortage = items.map((item) => ({
    ...item,
    shortage: Math.max(0, item.quantity - item.stock),
  }));

  const canResume = itemsWithShortage.every((item) => item.stock >= item.quantity);

  return (
    <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-amber-900">
            Menunggu Restock
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            Order ini tidak dapat diproses karena stok produk berikut belum
            mencukupi.
          </p>
        </div>
      </div>

      {itemsWithShortage.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Produk yang membutuhkan restock
          </p>
          <ul className="space-y-2">
            {itemsWithShortage.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-amber-200 bg-white px-4 py-3"
              >
                <p className="text-sm font-medium text-slate-900">
                  {item.product_name}
                </p>
                <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                  <p>Dibutuhkan : {item.quantity}</p>
                  <p>Stok tersedia : {item.stock}</p>
                  {item.shortage > 0 && (
                    <p className="font-medium text-amber-700">Kekurangan : {item.shortage}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={!canResume || loading}
          onClick={onResume}
          className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors ${
            canResume && !loading
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "cursor-not-allowed bg-slate-200 text-slate-400"
          }`}
        >
          Resume Fulfillment
        </button>
        {!canResume && (
          <span className="text-xs text-slate-400">
            Stok belum mencukupi untuk melanjutkan.
          </span>
        )}
      </div>
    </div>
  );
}
