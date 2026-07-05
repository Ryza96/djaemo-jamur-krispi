"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";
import { useCart } from "@/components/cart/CartProvider";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { formatPrice } from "@/lib/utils";
import { services, type ShippingService } from "@/lib/flatRateShipping";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [address, setAddress] = useState("");
  const [service, setService] = useState(services[0].label as ShippingService);
  const [detectedDestination, setDetectedDestination] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingError, setShippingError] = useState("");

  const grandTotal = useMemo(
    () => subtotal + shippingFee,
    [subtotal, shippingFee],
  );

  useEffect(() => {
    if (!address.trim() || items.length === 0) {
      setShippingFee(0);
      setDetectedDestination("");
      setShippingError("");
      setIsCalculating(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsCalculating(true);
      setShippingError("");

      try {
        const response = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, service }),
        });

        const data = await response.json();

        if (!response.ok) {
          setShippingFee(0);
          setDetectedDestination("");
          setShippingError(data.error || "Gagal menghitung ongkir.");
        } else {
          setShippingFee(data.shippingFee ?? 0);
          setDetectedDestination(data.destination ?? "Luar Jawa");
          setShippingError("");
        }
      } catch {
        setShippingFee(0);
        setDetectedDestination("");
        setShippingError("Tidak dapat terhubung ke layanan ongkir.");
      } finally {
        setIsCalculating(false);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [address, service, items.length]);

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
        <div className="grid gap-10 xl:grid-cols-[2fr_1fr]">
          <div className="divide-y divide-primary/10">
            {items.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-primary">Ringkasan Belanja</h2>
              <div className="mt-5">
                <CartSummary items={items} />
              </div>
            </div>

            <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Alamat Pengiriman
                  </label>
                  <textarea
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Masukkan alamat lengkap, misalnya nama jalan, kelurahan, dan kota"
                    className="w-full min-h-25 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Layanan
                  </label>
                  <select
                    value={service}
                    onChange={(event) => setService(event.target.value as ShippingService)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  >
                    {services.map((option) => (
                      <option key={option.label} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-3xl border border-primary/10 bg-surface p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm text-muted">
                      <span>Tujuan</span>
                      <span className="font-semibold text-primary">
                        {detectedDestination || "Masukkan alamat dulu"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted">
                      <span>Ongkos Kirim</span>
                      <span className="font-semibold text-primary">
                        {isCalculating ? "Menghitung..." : formatPrice(shippingFee)}
                      </span>
                    </div>
                    {shippingError ? (
                      <p className="text-xs text-red-500">{shippingError}</p>
                    ) : (
                      <p className="text-xs text-muted">
                        Ongkir dihitung otomatis berdasarkan alamat dan berat paket.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>Ongkir</span>
                  <span>{formatPrice(shippingFee)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-semibold text-primary">
                  <span>Total Bayar</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button href="/checkout" className="w-full">
                Lanjutkan Pembayaran
              </Button>
              <Button variant="outline" className="w-full" onClick={clearCart}>
                Kosongkan Keranjang
              </Button>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-sm text-slate-300">
              <p className="font-semibold text-slate-100">Metode Pembayaran</p>
              <ul className="mt-3 space-y-2">
                <li>1. Transfer bank ke nomor rekening kami.</li>
                <li>2. Konfirmasi via WhatsApp dengan bukti pembayaran.</li>
                <li>3. Pesanan akan diproses setelah pembayaran diterima.</li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </Section>
  );
}
