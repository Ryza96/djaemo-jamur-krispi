"use client";

import { useState } from "react";
import { useCheckout } from "@/components/checkout/CheckoutProvider";

const inputClass =
  "flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary";

export function VoucherSection() {
  const { state, dispatch } = useCheckout();
  const [code, setCode] = useState("");

  function handleApply() {
    if (!code.trim()) return;
    dispatch({ type: "SET_VOUCHER", payload: { code: code.trim(), discount: 0 } });
  }

  function handleRemove() {
    dispatch({ type: "SET_VOUCHER", payload: null });
    setCode("");
  }

  return (
    <div>
      {state.voucher ? (
        <div className="flex items-center justify-between rounded-2xl border border-secondary/30 bg-secondary/5 p-3 text-sm">
          <div>
            <span className="font-medium text-secondary">
              {state.voucher.code}
            </span>
            {state.voucher.discount > 0 && (
              <span className="ml-2 text-muted">
                ({formatDiscount(state.voucher.discount)})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-red-500 underline-offset-2 hover:underline"
          >
            Hapus
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Masukkan kode voucher"
            className={inputClass}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApply();
              }
            }}
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={!code.trim()}
            className="inline-flex items-center rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
          >
            Pakai
          </button>
        </div>
      )}
    </div>
  );
}

function formatDiscount(discount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(discount);
}
