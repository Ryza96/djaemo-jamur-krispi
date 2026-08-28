"use client";

import { useState } from "react";
import { useCheckout } from "@/components/checkout/CheckoutProvider";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/lib/utils";

const inputClass =
  "flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary";

interface ValidateResponse {
  success?: boolean;
  error?: string;
  discount?: {
    code: string;
    discount_percent: number;
    discount_amount: number;
  };
}

export function VoucherSection() {
  const { state, dispatch } = useCheckout();
  const { subtotal } = useCart();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/validate-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, subtotal }),
      });
      const data: ValidateResponse = await res.json();

      if (!res.ok || !data.success || !data.discount) {
        setError(data.error || "Kode voucher tidak valid");
        dispatch({ type: "SET_VOUCHER", payload: null });
        return;
      }

      dispatch({
        type: "SET_VOUCHER",
        payload: {
          code: data.discount.code,
          discount: data.discount.discount_amount,
          discountPercent: data.discount.discount_percent,
        },
      });
      setCode("");
    } catch {
      setError("Gagal memvalidasi voucher. Silakan coba lagi.");
      dispatch({ type: "SET_VOUCHER", payload: null });
    } finally {
      setLoading(false);
    }
  }

  function handleRemove() {
    dispatch({ type: "SET_VOUCHER", payload: null });
    setError(null);
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
                (-{formatPrice(state.voucher.discount)})
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
        <div className="flex flex-col gap-2">
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
              disabled={!code.trim() || loading}
              className="inline-flex items-center rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
            >
              {loading ? "..." : "Pakai"}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
