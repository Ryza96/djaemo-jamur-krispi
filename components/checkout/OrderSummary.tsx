"use client";

import { useCart } from "@/components/cart/CartProvider";
import { useCheckout } from "@/components/checkout/CheckoutProvider";
import { formatPrice } from "@/lib/utils";

export function OrderSummary() {
  const { items, subtotal } = useCart();
  const { state } = useCheckout();
  const { shippingFee, shippingCourier, shippingService } = state;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const voucherDiscount = state.voucher?.discount ?? 0;
  const total = subtotal + shippingFee - voucherDiscount;

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          Belum ada item di keranjang
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex flex-col gap-2 rounded-3xl border border-ink/10 bg-cream-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-muted">
                    {item.quantity}x {formatPrice(item.product.final_price)}
                  </p>
                </div>
                <p className="whitespace-nowrap font-semibold text-gold">
                  {formatPrice(item.product.final_price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-3xl bg-cream-2 p-4 text-sm">
            <div className="flex items-center justify-between text-muted">
              <span>Total Item</span>
              <span>{totalItems}</span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>Ongkos Kirim</span>
              <span className="text-right">
                {shippingFee > 0 ? (
                  <span className="flex flex-col items-end gap-0.5">
                    <span>{formatPrice(shippingFee)}</span>
                    {shippingCourier && (
                      <span className="text-xs font-normal text-muted">
                        {shippingCourier} {shippingService}
                      </span>
                    )}
                  </span>
                ) : (
                  "—"
                )}
              </span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex items-center justify-between text-teal-mid">
                <span>Diskon Voucher ({state.voucher?.code})</span>
                <span>-{formatPrice(voucherDiscount)}</span>
              </div>
            )}
            <div className="border-t border-ink/10 pt-2 text-lg font-semibold text-ink flex items-center justify-between">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
