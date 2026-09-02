"use client";

import { Section, PageHeader } from "@/components/sections/Section";
import { CheckoutProvider } from "@/components/checkout/CheckoutProvider";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";

function CheckoutContent() {
  const { items } = useCart();

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center shadow-sm">
        <p className="text-lg font-semibold text-ink">
          Tidak ada pesanan untuk diproses
        </p>
        <p className="mt-3 text-sm text-muted">
          Kembali ke halaman Produk untuk menambahkan item terlebih dahulu.
        </p>
        <Button href="/produk" className="mt-8">
          Kembali ke Produk
        </Button>
      </div>
    );
  }

  return <CheckoutForm />;
}

export default function CheckoutPage() {
  return (
    <Section>
      <PageHeader
        title="Checkout"
        description="Konfirmasi pesanan dan lengkapi data pengiriman."
      />
      <CheckoutProvider>
        <CheckoutContent />
      </CheckoutProvider>
    </Section>
  );
}
