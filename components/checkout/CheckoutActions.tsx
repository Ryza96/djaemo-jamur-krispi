"use client";

import { useState } from "react";
import Link from "next/link";
import { useCheckout } from "@/components/checkout/CheckoutProvider";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";

export function CheckoutActions() {
  const { state } = useCheckout();
  const { items } = useCart();
  const [hasConsented, setHasConsented] = useState(false);

  const isEmpty = items.length === 0;

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 text-sm text-muted">
        <input
          type="checkbox"
          checked={hasConsented}
          onChange={(e) => setHasConsented(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-red"
        />
        <span>
          Saya telah membaca dan menyetujui{" "}
          <Link
            href="/syarat-ketentuan"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink hover:underline"
          >
            Syarat &amp; Ketentuan
          </Link>{" "}
          serta{" "}
          <Link
            href="/kebijakan-privasi"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink hover:underline"
          >
            Kebijakan Privasi
          </Link>
        </span>
      </label>
      <Button
        type="submit"
        className="w-full"
        disabled={state.isSubmitting || isEmpty || !hasConsented}
      >
        {state.isSubmitting
          ? "Memproses..."
          : state.resume
            ? "Lanjutkan Pembayaran"
            : "Buat Pesanan"}
      </Button>
      <Button href="/cart" variant="outline" className="w-full">
        Kembali ke Keranjang
      </Button>
    </div>
  );
}
