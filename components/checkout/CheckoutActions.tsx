"use client";

import { useCheckout } from "@/components/checkout/CheckoutProvider";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";

export function CheckoutActions() {
  const { state } = useCheckout();
  const { items } = useCart();

  const isEmpty = items.length === 0;

  return (
    <div className="space-y-3">
      <Button
        type="submit"
        className="w-full"
        disabled={state.isSubmitting || isEmpty}
      >
        {state.isSubmitting ? "Memproses..." : "Buat Pesanan"}
      </Button>
      <Button href="/cart" variant="outline" className="w-full">
        Kembali ke Keranjang
      </Button>
    </div>
  );
}
