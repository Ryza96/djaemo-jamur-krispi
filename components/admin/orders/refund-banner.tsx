"use client";

import { formatPrice } from "@/lib/utils";

interface RefundBannerProps {
  amount: number | null;
  loading?: boolean;
  onMarkRefunded: () => void;
}

export function RefundBanner({
  amount,
  loading,
  onMarkRefunded,
}: RefundBannerProps) {
  return (
    <div className="mb-6 rounded-3xl border-2 border-rose-300 bg-rose-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
          <span className="text-lg" aria-hidden>
            ⚠️
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-rose-800">
            Refund manual diperlukan
            {amount != null ? ` - ${formatPrice(amount)}` : ""}
          </h3>
          <p className="mt-1 text-sm text-rose-700">
            Pesanan ini dibatalkan setelah pembayaran diterima. Dana customer{" "}
            {amount != null ? `sebesar ${formatPrice(amount)} ` : ""}
            wajib dikembalikan melalui Midtrans Dashboard. Tandai &quot;Sudah
            Direfund&quot; setelah refund selesai diproses.
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={onMarkRefunded}
            disabled={loading}
            className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Sudah Direfund"}
          </button>
        </div>
      </div>
    </div>
  );
}
