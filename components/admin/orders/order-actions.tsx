"use client";

import { useState } from "react";
import { useOrderActions } from "@/hooks/use-order-actions";
import { useOrderShipment } from "@/hooks/use-order-shipment";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";

interface ActionDef {
  action: "confirm" | "pack" | "ship" | "complete" | "cancel" | "create_shipment";
  label: string;
  description: string;
  variant: "primary" | "danger";
}

interface OrderActionsProps {
  orderId: string;
  fulfillmentStatus: string | null;
  paymentStatus: string | null;
  shipmentId: string | null;
  totalAmount: number | null;
  onSuccess: () => void;
}

function getActions(
  status: string | null,
  paymentStatus: string | null,
  shipmentId: string | null,
): ActionDef[] {
  switch (status?.toLowerCase()) {
    case "new":
      if (paymentStatus !== "paid") {
        return [
          {
            action: "cancel",
            label: "Batalkan Pesanan",
            description:
              "Batalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.",
            variant: "danger",
          },
        ];
      }

      return [
        {
          action: "confirm",
          label: "Konfirmasi Pesanan",
          description: "Konfirmasi pesanan ini?",
          variant: "primary",
        },
        {
          action: "cancel",
          label: "Batalkan Pesanan",
          description:
            "Batalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.",
          variant: "danger",
        },
      ];
    case "confirmed":
      if (shipmentId) return [];

      const confirmedActions: ActionDef[] = [];

      confirmedActions.push({
        action: "pack",
        label: "Mulai Packing",
        description: "Mulai proses pengepakan pesanan?",
        variant: "primary",
      });

      confirmedActions.push({
        action: "cancel",
        label: "Batalkan Pesanan",
        description:
          "Batalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.",
        variant: "danger",
      });

      return confirmedActions;
    case "packing":
      if (shipmentId) return [];

      const packingActions: ActionDef[] = [];

      packingActions.push({
        action: "create_shipment",
        label: "Buat Resi",
        description: "Buat resi pengiriman melalui Biteship?",
        variant: "primary",
      });

      packingActions.push({
        action: "cancel",
        label: "Batalkan Pesanan",
        description:
          "Batalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.",
        variant: "danger",
      });

      return packingActions;
    case "waybill_created":
    case "picked_up":
    case "delivered":
      return [];
    case "processing":
      if (shipmentId) return [];

      const actions: ActionDef[] = [];

      if (paymentStatus === "paid") {
        actions.push({
          action: "create_shipment",
          label: "Buat Resi",
          description: "Buat resi pengiriman melalui Biteship?",
          variant: "primary",
        });
      }

      actions.push({
        action: "ship",
        label: "Tandai Dikirim",
        description:
          "Tandai pesanan sebagai sudah dikirim? Pastikan resi sudah diisi.",
        variant: "primary",
      });

      actions.push({
        action: "cancel",
        label: "Batalkan Pesanan",
        description:
          "Batalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.",
        variant: "danger",
      });

      return actions;
    case "shipped":
      return [
        {
          action: "complete",
          label: "Selesaikan Pesanan",
          description: "Tandai pesanan sebagai selesai?",
          variant: "primary",
        },
      ];
    default:
      return [];
  }
}

function CancelWarning({
  paymentStatus,
  totalAmount,
}: {
  paymentStatus: string | null;
  totalAmount: number | null;
}) {
  const isPaid = paymentStatus === "paid";

  if (isPaid) {
    return (
      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <p className="text-sm font-semibold text-rose-700">
          Pesanan ini SUDAH DIBAYAR
          {totalAmount != null ? ` sebesar ${formatPrice(totalAmount)}` : ""}.
        </p>
        <p className="mt-1 text-sm text-rose-600">
          Setelah dibatalkan, dana customer{" "}
          {totalAmount != null ? `(${formatPrice(totalAmount)})` : ""} WAJIB
          di-refund manual melalui Midtrans Dashboard. Pengingat refund akan
          tampil permanen di halaman pesanan ini sampai Anda menandainya
          &quot;Sudah Direfund&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-800">
        Pembayaran mungkin masih bisa masuk.
      </p>
      <p className="mt-1 text-sm text-amber-700">
        Customer masih dapat menyelesaikan pembayaran selama token pembayaran
        aktif. Jika pembayaran masuk setelah pesanan dibatalkan, sistem akan
        otomatis memulihkan pesanan ini setelah diverifikasi ke Midtrans.
        Pembatalan bersifat permanen.
      </p>
    </div>
  );
}

function ConfirmationDialog({
  action,
  loading,
  paymentStatus,
  totalAmount,
  onConfirm,
  onCancel,
}: {
  action: ActionDef;
  loading: boolean;
  paymentStatus: string | null;
  totalAmount: number | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">
          {action.label}
        </h3>
        <p className="mt-2 text-sm text-slate-500">{action.description}</p>

        {action.action === "cancel" && (
          <CancelWarning
            paymentStatus={paymentStatus}
            totalAmount={totalAmount}
          />
        )}

        {action.action === "cancel" && (
          <div className="mt-4">
            <label className="text-xs font-medium text-slate-500">
              Alasan Pembatalan (opsional)
            </label>
            <textarea
              id="cancel-reason"
              className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
              rows={3}
              placeholder="Masukkan alasan pembatalan..."
            />
          </div>
        )}

        {action.action === "ship" && (
          <div className="mt-4">
            <label className="text-xs font-medium text-slate-500">
              Nomor Resi (opsional)
            </label>
            <input
              id="waybill-id"
              type="text"
              className="mt-1 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
              placeholder="Masukkan nomor resi..."
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              action.variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {loading
              ? action.action === "create_shipment"
                ? "Creating Shipment..."
                : "Memproses..."
              : "Konfirmasi"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrderActions({
  orderId,
  fulfillmentStatus,
  paymentStatus,
  shipmentId,
  totalAmount,
  onSuccess,
}: OrderActionsProps) {
  const { execute: executeAction, loading: actionsLoading } = useOrderActions();
  const { create: createShipment, loading: shipmentLoading } = useOrderShipment();
  const { showToast } = useToast();
  const [confirmAction, setConfirmAction] = useState<ActionDef | null>(null);

  const loading = actionsLoading || shipmentLoading;

  const actions = getActions(fulfillmentStatus, paymentStatus, shipmentId);

  const handleConfirm = async () => {
    if (!confirmAction) return;

    if (confirmAction.action === "create_shipment") {
      setConfirmAction(null);
      const result = await createShipment(orderId);
      if (result.success) {
        showToast("Resi berhasil dibuat.", "success");
        onSuccess();
      } else {
        showToast(result.error ?? "Gagal membuat resi.", "error");
      }
      return;
    }

    const reasonEl = document.getElementById(
      "cancel-reason",
    ) as HTMLTextAreaElement | null;
    const waybillEl = document.getElementById(
      "waybill-id",
    ) as HTMLInputElement | null;

    const result = await executeAction(orderId, confirmAction.action, {
      cancellation_reason: reasonEl?.value || undefined,
      waybill_id: waybillEl?.value || undefined,
    });

    setConfirmAction(null);

    if (result.success) {
      showToast("Status pesanan berhasil diperbarui.", "success");
      onSuccess();
    } else {
      showToast(result.error ?? "Gagal memperbarui status.", "error");
    }
  };

  if (actions.length === 0) {
    const lowerStatus = fulfillmentStatus?.toLowerCase() ?? "";

    if (shipmentId && lowerStatus === "waybill_created") {
      return (
        <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Order Actions
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Waiting for courier pickup
          </span>
        </div>
      );
    }

    const shippingStatuses = ["processing", "packing", "picked_up"];
    if (shipmentId && shippingStatuses.includes(lowerStatus)) {
      return (
        <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Order Actions
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Shipment Created
          </span>
        </div>
      );
    }

    const terminalStatuses = ["completed", "delivered"];
    const label =
      terminalStatuses.includes(fulfillmentStatus?.toLowerCase() ?? "")
        ? "Order Completed"
        : fulfillmentStatus?.toLowerCase() === "cancelled"
          ? "Order Cancelled"
          : null;

    if (!label) return null;

    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Order Actions
        </h2>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${
            terminalStatuses.includes(fulfillmentStatus?.toLowerCase() ?? "")
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              terminalStatuses.includes(fulfillmentStatus?.toLowerCase() ?? "")
                ? "bg-emerald-500"
                : "bg-rose-500"
            }`}
          />
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Order Actions
      </h2>
      <div className="flex flex-wrap gap-3">
        {actions.map((act) => (
          <button
            key={act.action}
            onClick={() => setConfirmAction(act)}
            disabled={loading}
            className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
              act.variant === "danger"
                ? "border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {act.label}
          </button>
        ))}
      </div>

      {confirmAction && (
        <ConfirmationDialog
          action={confirmAction}
          loading={loading}
          paymentStatus={paymentStatus}
          totalAmount={totalAmount}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
