"use client";

import { useEffect } from "react";
import { useCheckout } from "@/components/checkout/CheckoutProvider";
import { useShipping } from "@/components/checkout/shipping/ShippingProvider";
import { useCart } from "@/components/cart/CartProvider";
import {
  calculateCodEligibleAmount,
  COD_MAX_TOTAL,
  isCodAllowedProvince,
} from "@/lib/services/payment/cod.constants";
import { formatPrice } from "@/lib/utils";

export function PaymentMethodSection() {
  const { state, dispatch } = useCheckout();
  const { state: shippingState } = useShipping();
  const { subtotal } = useCart();

  const discount = state.voucher?.discount ?? 0;
  const selected =
    shippingState.rates.find((r) => r.id === shippingState.selectedId) ?? null;

  const provinceAllowed = isCodAllowedProvince(state.shippingAddress.province);
  const selectedCodFee = selected?.codFee ?? 0;
  const spendCapOk =
    calculateCodEligibleAmount({
      subtotal,
      discountAmount: discount,
      shippingFee: state.shippingFee,
      codFee: selectedCodFee,
    }) <= COD_MAX_TOTAL;

  const codPossible =
    !!selected &&
    selected.codAvailable === true &&
    provinceAllowed &&
    spendCapOk;

  useEffect(() => {
    if (state.paymentMethod === "cod" && !codPossible) {
      dispatch({ type: "SET_PAYMENT_METHOD", payload: "online" });
    }
  }, [codPossible, state.paymentMethod, dispatch]);

  const codFee = codPossible ? selectedCodFee : 0;

  function selectMethod(method: "online" | "cod") {
    dispatch({ type: "SET_PAYMENT_METHOD", payload: method });
  }

  const radioClass = (active: boolean) =>
    `flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left text-sm transition ${
      active
        ? "border-teal-deep bg-teal-deep/5 ring-1 ring-teal-deep"
        : "border-ink/10 bg-white hover:border-ink/30"
    }`;

  const dotClass = (active: boolean) =>
    `mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
      active ? "border-teal-deep" : "border-slate-300"
    }`;

  return (
    <div className="space-y-3">
      <button
        type="button"
        role="radio"
        aria-checked={state.paymentMethod === "online"}
        onClick={() => selectMethod("online")}
        className={radioClass(state.paymentMethod === "online")}
      >
        <span className={dotClass(state.paymentMethod === "online")}>
          {state.paymentMethod === "online" && (
            <span className="h-2 w-2 rounded-full bg-teal-deep" />
          )}
        </span>
        <span className="min-w-0">
          <span className="font-semibold text-ink">Bayar Online (Midtrans)</span>
          <span className="mt-0.5 block text-xs text-muted">
            Transfer bank, QRIS, e-wallet, atau kartu. Pembayaran diproses aman
            lewat Midtrans setelah pesanan dibuat.
          </span>
        </span>
      </button>

      {codPossible ? (
        <button
          type="button"
          role="radio"
          aria-checked={state.paymentMethod === "cod"}
          onClick={() => selectMethod("cod")}
          className={radioClass(state.paymentMethod === "cod")}
        >
          <span className={dotClass(state.paymentMethod === "cod")}>
            {state.paymentMethod === "cod" && (
              <span className="h-2 w-2 rounded-full bg-teal-deep" />
            )}
          </span>
          <span className="min-w-0">
            <span className="font-semibold text-ink">Bayar di Tempat (COD)</span>
            <span className="mt-0.5 block text-xs text-muted">
              Bayar tunai saat kurir mengantar paket.
              {codFee > 0
                ? ` Biaya COD ${formatPrice(codFee)} ditambahkan ke total pesanan.`
                : " Tanpa biaya tambahan."}
            </span>
          </span>
        </button>
      ) : selected ? (
        <p className="rounded-2xl border border-ink/10 bg-cream-2 p-4 text-xs text-muted">
          COD tidak tersedia untuk pesanan ini.
          {!provinceAllowed
            ? " COD hanya berlaku untuk pengiriman di Pulau Jawa."
            : !spendCapOk
              ? ` COD hanya berlaku untuk total maksimal ${formatPrice(COD_MAX_TOTAL)}.`
              : " Layanan pengiriman ini tidak mendukung COD — silakan pilih kurir lain atau bayar online."}
        </p>
      ) : (
        <p className="rounded-2xl border border-ink/10 bg-cream-2 p-4 text-xs text-muted">
          Pilih kurir pengiriman terlebih dahulu untuk melihat ketersediaan
          pembayaran COD.
        </p>
      )}
    </div>
  );
}