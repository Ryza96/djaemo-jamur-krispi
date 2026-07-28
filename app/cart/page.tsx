"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";
import { useCart } from "@/components/cart/CartProvider";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();

  return (
    <Section>
      <PageHeader
        title="Keranjang Belanja"
        description="Periksa pesanan Anda sebelum melanjutkan ke proses pembayaran."
      />

      {items.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-primary">Keranjang Anda kosong</p>
          <p className="mt-3 text-sm text-muted">
            Tambahkan produk dari halaman Produk untuk melihatnya di sini.
          </p>
          <Button href="/produk" className="mt-8">
            Lihat Produk
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="min-w-0 flex-[7] divide-y divide-primary/10">
            {items.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          <aside className="flex-[3]">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-primary">Ringkasan Belanja</h2>
                <div className="mt-5">
                  <CartSummary items={items} />
                </div>
              </div>

              <div className="space-y-3">
                <Button href="/checkout" className="w-full">
                  Lanjut ke Checkout
                </Button>
                <Button variant="outline" className="w-full" onClick={clearCart}>
                  Kosongkan Keranjang
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </Section>
  );
}
