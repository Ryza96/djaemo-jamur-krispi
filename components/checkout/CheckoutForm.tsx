"use client";

import { useCallback, useRef, useState } from "react";
import { useCheckout } from "@/components/checkout/CheckoutProvider";
import { useCart } from "@/components/cart/CartProvider";
import { CustomerInfo } from "@/components/checkout/CustomerInfo";
import { ShippingAddress } from "@/components/checkout/ShippingAddress";
import { ShippingSelectorInner } from "@/components/checkout/shipping/ShippingSelector";
import { ShippingProvider } from "@/components/checkout/shipping/ShippingProvider";
import { PaymentMethodSection } from "@/components/checkout/PaymentMethodSection";
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
  const { items, subtotal, clearCart } = useCart();

  const ORDER_STORAGE_KEY = "djaemo-last-order";
  const [isDiscardingResume, setIsDiscardingResume] = useState(false);
  const [discardError, setDiscardError] = useState<string | null>(null);

  const [orderId, setOrderId] = useState(() => buildOrderId());

  // Refs adalah source of truth untuk mencegah double-submit. State
  // `isSubmitting` baru mematikan tombol setelah React re-render, sehingga
  // dua submit yang tiba sangat cepat (double-click / Enter ganda) bisa lolos
  // sebelum render selesai. Ref berubah sinkron di dalam event handler yang
  // sama, jadi guard ini efektif tanpa menunggu siklus render React.
  const isSubmittingRef = useRef(false);

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
          paymentMethod: state.paymentMethod,
          codFee: state.codFee,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          return false;
        }
        throw new Error(data.error || "Gagal membuat transaksi");
      }

      // COD: tidak ada redirect Snap. Redirect ke halaman sukses yang
      // menampilkan status pesanan + instruksi bayar tunai saat kurir tiba.
      if (data.paymentMethod === "cod") {
        try {
          window.localStorage.setItem(
            ORDER_STORAGE_KEY,
            JSON.stringify({
              orderId: data.orderId,
              accessToken: data.accessToken,
              totalAmount: data.totalAmount,
              createdAt: new Date().toISOString(),
              status: "pending_payment",
              paymentMethod: "cod",
            }),
          );
        } catch {
          // localStorage not available
        }

        clearCart();
        window.location.href = `/checkout/success?order_id=${encodeURIComponent(
          data.orderId,
        )}&token=${encodeURIComponent(data.accessToken)}`;
        return true;
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
              paymentMethod: "online",
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
      state.paymentMethod,
      state.codFee,
      items,
      subtotal,
      clearCart,
    ],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
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
          const retryDone = await createOrderAndPay(newOrderId);
          if (!retryDone) {
            dispatch({
              type: "SET_ERROR",
              payload:
                "Terjadi konflik saat membuat pesanan. Silakan coba lagi.",
            });
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Terjadi kesalahan saat checkout";
        dispatch({ type: "SET_ERROR", payload: message });
      } finally {
        isSubmittingRef.current = false;
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

  async function handleDiscardResume() {
    if (!state.resume || isDiscardingResume) return;
    setIsDiscardingResume(true);
    setDiscardError(null);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(state.resume.orderId)}/expire`,
        {
          method: "POST",
          headers: { "X-Order-Token": state.resume.accessToken },
        },
      );
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setDiscardError(
          json?.error ??
            "Tidak dapat membatalkan pesanan lama. Silakan coba lagi.",
        );
        return;
      }

      try {
        window.localStorage.removeItem(ORDER_STORAGE_KEY);
      } catch {
        // localStorage not available
      }
      dispatch({ type: "RESET" });
      setOrderId(buildOrderId());
    } catch {
      setDiscardError(
        "Tidak dapat membatalkan pesanan lama. Periksa koneksi Anda dan coba lagi.",
      );
    } finally {
      setIsDiscardingResume(false);
    }
  }

  return (
    <ShippingProvider>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
          {state.resume && (
            <section className="rounded-3xl border border-gold/30 bg-gold/10 p-6 shadow-sm">
              <h2 className="mb-1 text-lg font-semibold text-ink">
                Pesanan Belum Dibayar
              </h2>
              <p className="text-sm text-muted">
                Pesanan{" "}
                <span className="font-semibold text-ink">
                  {state.resume.orderId}
                </span>{" "}
                masih menunggu pembayaran. Lanjutkan pembayaran, atau batalkan
                untuk membuat pesanan baru.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleContinuePayment} disabled={isDiscardingResume}>
                  Lanjutkan Pembayaran
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDiscardResume}
                  disabled={isDiscardingResume}
                >
                  {isDiscardingResume ? "Membatalkan..." : "Batalkan & Buat Pesanan Baru"}
                </Button>
              </div>
              {discardError && (
                <p className="mt-2 text-sm text-red-600">{discardError}</p>
              )}
            </section>
          )}

          <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-ink">
              Informasi Pembeli
            </h2>
            <p className="mb-4 text-sm text-muted">
              Data yang diperlukan untuk konfirmasi pesanan
            </p>
            <CustomerInfo />
          </section>

          <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-ink">
              Alamat Pengiriman
            </h2>
            <p className="mb-4 text-sm text-muted">
              Pastikan alamat lengkap untuk memudahkan pengiriman
            </p>
            <ShippingAddress />
          </section>

          <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-ink">
              Metode Pengiriman
            </h2>
            <p className="mb-4 text-sm text-muted">
              Pilih kurir dan layanan pengiriman
            </p>
            <ShippingSelectorInner />
          </section>

          <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-ink">
              Metode Pembayaran
            </h2>
            <p className="mb-4 text-sm text-muted">
              Pilih cara pembayaran pesanan Anda
            </p>
            <PaymentMethodSection />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-ink">
              Ringkasan Pesanan
            </h2>
            <OrderSummary />
          </section>

          <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-ink">
              Voucher
            </h2>
            <VoucherSection />
          </section>

          {state.error && (
            <div
              role="alert"
              className="rounded-3xl border border-red/20 bg-red/10 p-4 text-sm text-red"
            >
              {state.error}
            </div>
          )}

          <CheckoutActions />
        </aside>
      </div>
      </form>
    </ShippingProvider>
  );
}
