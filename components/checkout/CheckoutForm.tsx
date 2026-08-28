"use client";

import { useCallback, useState } from "react";
import { useCheckout } from "@/components/checkout/CheckoutProvider";
import { useCart } from "@/components/cart/CartProvider";
import { CustomerInfo } from "@/components/checkout/CustomerInfo";
import { ShippingAddress } from "@/components/checkout/ShippingAddress";
import { ShippingSelector } from "@/components/checkout/shipping/ShippingSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { VoucherSection } from "@/components/checkout/VoucherSection";
import { CheckoutActions } from "@/components/checkout/CheckoutActions";
import { Button } from "@/components/ui/Button";
import {
  customerInfoSchema,
  shippingAddressSchema,
} from "@/lib/validation/checkout";
import { buildOrderId } from "@/lib/order";
import { decideResume } from "@/lib/checkout/resumeOrder";

export function CheckoutForm() {
  const { state, dispatch } = useCheckout();
  const { items, subtotal } = useCart();

  const ORDER_STORAGE_KEY = "djaemo-last-order";

  const [orderId, setOrderId] = useState(() => buildOrderId());

  const createOrderAndPay = useCallback(
    async (currentOrderId: string): Promise<boolean> => {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: currentOrderId,
          customerInfo: state.customerInfo,
          shippingAddress: state.shippingAddress,
          shippingCourier: state.shippingCourier,
          shippingService: state.shippingService,
          shippingFee: state.shippingFee,
          items: items.map((item) => ({
            product: {
              id: item.product.id,
              name: item.product.name,
              price: item.product.final_price,
            },
            quantity: item.quantity,
          })),
          subtotal,
          voucherCode: state.voucher?.code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          return false;
        }
        throw new Error(data.error || "Gagal membuat transaksi");
      }

      if (data.redirectUrl) {
        try {
          window.localStorage.setItem(
            ORDER_STORAGE_KEY,
            JSON.stringify({
              orderId: data.orderId,
              accessToken: data.accessToken,
              totalAmount: data.totalAmount,
              createdAt: new Date().toISOString(),
              status: "pending_payment",
            }),
          );
        } catch {
          // localStorage not available
        }

        window.location.href = data.redirectUrl;
      }

      return true;
    },
    [
      state.customerInfo,
      state.shippingAddress,
      state.shippingFee,
      state.shippingService,
      state.shippingCourier,
      state.voucher,
      items,
      subtotal,
    ],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      dispatch({ type: "SET_ERROR", payload: null });

      const resume = await decideResume();
      if (resume.kind === "resume") {
        window.location.href = resume.redirectUrl;
        return;
      }

      const customerResult = customerInfoSchema.safeParse(
        state.customerInfo,
      );
      if (!customerResult.success) {
        const firstError =
          customerResult.error.issues[0]?.message ?? "Data pembeli tidak valid";
        dispatch({ type: "SET_ERROR", payload: firstError });
        return;
      }

      const addressResult = shippingAddressSchema.safeParse(
        state.shippingAddress,
      );
      if (!addressResult.success) {
        const firstError =
          addressResult.error.issues[0]?.message ??
          "Alamat pengiriman tidak valid";
        dispatch({ type: "SET_ERROR", payload: firstError });
        return;
      }

      if (items.length === 0) {
        dispatch({ type: "SET_ERROR", payload: "Keranjang belanja kosong" });
        return;
      }

      if (!state.shippingService || state.shippingFee <= 0) {
        dispatch({
          type: "SET_ERROR",
          payload: "Pilih metode pengiriman terlebih dahulu",
        });
        return;
      }

      dispatch({ type: "SET_SUBMITTING", payload: true });

      try {
        const done = await createOrderAndPay(orderId);
        if (!done) {
          // Order ID sudah ada di server (409): regenerate & retry maksimal 1x
          const newOrderId = buildOrderId();
          setOrderId(newOrderId);
          await createOrderAndPay(newOrderId);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Terjadi kesalahan saat checkout";
        dispatch({ type: "SET_ERROR", payload: message });
      } finally {
        dispatch({ type: "SET_SUBMITTING", payload: false });
      }
    },
    [
      state.customerInfo,
      state.shippingAddress,
      state.shippingFee,
      state.shippingService,
      orderId,
      items,
      dispatch,
      createOrderAndPay,
    ],
  );

  function handleContinuePayment() {
    if (!state.resume) return;
    window.location.href = state.resume.redirectUrl;
  }

  function handleDiscardResume() {
    try {
      window.localStorage.removeItem(ORDER_STORAGE_KEY);
    } catch {
      // localStorage not available
    }
    dispatch({ type: "RESET" });
    setOrderId(buildOrderId());
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          {state.resume && (
            <section className="rounded-3xl border border-amber-500/30 bg-amber-50 p-6 shadow-sm">
              <h2 className="mb-1 text-lg font-semibold text-primary">
                Pesanan Belum Dibayar
              </h2>
              <p className="text-sm text-muted">
                Pesanan{" "}
                <span className="font-semibold text-primary">
                  {state.resume.orderId}
                </span>{" "}
                masih menunggu pembayaran. Lanjutkan pembayaran, atau batalkan
                untuk membuat pesanan baru.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleContinuePayment}>
                  Lanjutkan Pembayaran
                </Button>
                <Button variant="outline" onClick={handleDiscardResume}>
                  Batalkan &amp; Buat Pesanan Baru
                </Button>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-primary">
              Informasi Pembeli
            </h2>
            <p className="mb-4 text-sm text-muted">
              Data yang diperlukan untuk konfirmasi pesanan
            </p>
            <CustomerInfo />
          </section>

          <section className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-primary">
              Alamat Pengiriman
            </h2>
            <p className="mb-4 text-sm text-muted">
              Pastikan alamat lengkap untuk memudahkan pengiriman
            </p>
            <ShippingAddress />
          </section>

          <section className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-primary">
              Metode Pengiriman
            </h2>
            <p className="mb-4 text-sm text-muted">
              Pilih kurir dan layanan pengiriman
            </p>
            <ShippingSelector />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-primary">
              Ringkasan Pesanan
            </h2>
            <OrderSummary />
          </section>

          <section className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-primary">
              Voucher
            </h2>
            <VoucherSection />
          </section>

          {state.error && (
            <div
              role="alert"
              className="rounded-3xl border border-red-500/20 bg-red-50 p-4 text-sm text-red-700"
            >
              {state.error}
            </div>
          )}

          <CheckoutActions />
        </aside>
      </div>
    </form>
  );
}
