"use client";

import { useState } from "react";
import { useOrderActions } from "@/hooks/use-order-actions";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";

interface CodConfirmProps {
  orderId: string;
  paymentStatus: string | null;
  totalAmount: number | null;
  onSuccess: () => void;
}

export function CodConfirm({
  orderId,
  paymentStatus,
  totalAmount,
  onSuccess,
}: CodConfirmProps) {
  const { execute, loading } = useOrderActions();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);

  const status = paymentStatus?.toLowerCase();

  if (status === "paid") return null;

  const awaitingDelivery = status === "cod_awaiting_confirmation";
  const description = awaitingDelivery
    ? "Paket sudah diterima pembeli. Konfirmasi setelah uang lunas benar-benar Anda terima di tempat."
    : "Menunggu kurir mengonfirmasi paket terkirim sebelum COD bisa dikonfirmasi lunas.";

  const canConfirm = awaitingDelivery;

  const handleConfirm = async () => {
    if (!confirming) return;
    setConfirming(false);

    const result = await execute(orderId, "confirm_cod");
    if (result.success) {
      showToast("COD ditandai lunas.", "success");
      onSuccess();
    } else {
      showToast(result.error ?? "Gagal mengonfirmasi COD.", "error");
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        COD Payment
      </h2>
      <div
        className={`rounded-2xl border p-4 ${
          awaitingDelivery
            ? "border-violet-200 bg-violet-50"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <p className="text-sm font-semibold text-slate-900">
          {awaitingDelivery ? "Menunggu Konfirmasi Pelunasan" : "Bayar di Tempat (COD)"}
        </p>
        <p className="mt-1 text-xs text-slate-600">{description}</p>
        {totalAmount != null && (
          <p className="mt-2 text-sm text-slate-700">
            Jumlah yang harus dibayar pembeli:{" "}
            <span className="font-bold text-ink">{formatPrice(totalAmount)}</span>
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={loading || !canConfirm}
        onClick={() => setConfirming(true)}
        className={`mt-4 w-full rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
          awaitingDelivery
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        Konfirmasi COD Lunas
      </button>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Konfirmasi COD Lunas
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Tandai pesanan ini sebagai lunas? Pastikan uang{" "}
              {totalAmount != null ? `(${formatPrice(totalAmount)}) ` : ""}
              sudah benar-benar diterima secara tunai saat pengantaran.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Memproses..." : "Ya, Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}