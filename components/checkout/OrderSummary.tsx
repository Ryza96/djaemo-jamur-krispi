"use client";

import { useCart } from "@/components/cart/CartProvider";
import { useCheckout } from "@/components/checkout/CheckoutProvider";
import { formatPrice } from "@/lib/utils";

export function OrderSummary() {
  const { items, subtotal } = useCart();
  const { state } = useCheckout();
  const { shippingFee, shippingCourier, shippingService } = state;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = subtotal + shippingFee;

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
                className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-primary">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-muted">
                    {item.quantity}x {formatPrice(item.product.price)}
                  </p>
                </div>
                <p className="whitespace-nowrap font-semibold text-secondary">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-3xl bg-surface p-4 text-sm">
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
            <div className="border-t border-slate-200 pt-2 text-lg font-semibold text-primary flex items-center justify-between">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
