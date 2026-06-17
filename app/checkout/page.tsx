"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/lib/utils";
import { buildOrderId } from "@/lib/order";
import { services, parseDestinationFromAddress, type ShippingService } from "@/lib/flatRateShipping";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [shippingService, setShippingService] = useState<ShippingService>(services[0].label as ShippingService);
  const [shippingFee, setShippingFee] = useState(0);
  const [transactionId, setTransactionId] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState("Menunggu data pembeli...");
  const [isCreating, setIsCreating] = useState(false);

  const orderId = useMemo(() => buildOrderId(items), [items]);
  const ORDER_STORAGE_KEY = "djaemo-last-order";
  const totalAmount = subtotal + shippingFee;
  const detectedDestination = parseDestinationFromAddress(customerAddress);

  // Calculate shipping fee when address or service changes
  useEffect(() => {
    if (!customerAddress.trim() || items.length === 0) {
      setShippingFee(0);
      return;
    }

    const fetchShipping = async () => {
      try {
        const response = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: customerAddress,
            service: shippingService,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setShippingFee(data.shippingFee ?? 0);
        }
      } catch (error) {
        console.error("Error fetching shipping:", error);
      }
    };

    const timer = setTimeout(fetchShipping, 300);
    return () => clearTimeout(timer);
  }, [customerAddress, shippingService, items.length]);

  const isFormValid =
    customerName.trim().length > 0 &&
    customerEmail.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    customerAddress.trim().length > 0 &&
    items.length > 0;

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setCheckoutError("Semua kolom data pembeli harus diisi.");
      setCheckoutStatus("Data pembeli belum lengkap.");
      return;
    }

    if (!validateEmail(customerEmail)) {
      setCheckoutError("Alamat email tidak valid.");
      setCheckoutStatus("Validasi email gagal.");
      return;
    }

    setIsCreating(true);
    setCheckoutError("");
    setCheckoutStatus("Membuat transaksi pembayaran...");

    try {
      const paymentResponse = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          items,
          subtotal,
          shippingFee,
          customerName,
          customerPhone,
          customerEmail,
          customerAddress,
          destination: detectedDestination,
          shippingService,
        }),
      });

      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || "Gagal membuat transaksi pembayaran.");
      }

      const transaction = paymentData.transaction_id || paymentData.transactionId || orderId;
      setTransactionId(transaction);
      setCheckoutStatus("Mengarahkan ke halaman pembayaran Midtrans...");

      // Redirect to Midtrans payment page
      if (paymentData.redirect_url) {
        window.location.href = paymentData.redirect_url;
      }

      const orderPayload = {
        orderId,
        transactionId: transaction,
        items,
        subtotal,
        shippingFee,
        totalAmount,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        status: "Berhasil dibuat",
        createdAt: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orderPayload));
      }
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Terjadi kesalahan saat checkout.");
      setCheckoutStatus("Transaksi gagal.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Section>
      <PageHeader
        title="Checkout"
        description="Konfirmasi pesanan dan pilih metode pembayaran yang tersedia."
      />

      {items.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-primary">Tidak ada pesanan untuk diproses</p>
          <p className="mt-3 text-sm text-muted">
            Kembali ke halaman Produk untuk menambahkan item terlebih dahulu.
          </p>
          <Button href="/produk" className="mt-8">
            Kembali ke Produk
          </Button>
        </div>
      ) : (
        <div className="grid gap-10 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-6 rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">Detail Pesanan</h2>
              <p className="text-sm text-muted">
                Pastikan semua item sudah benar sebelum melakukan pembayaran.
              </p>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <p className="font-semibold text-primary">{item.product.name}</p>
                      <p className="text-sm text-muted">{item.product.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted">Jumlah: {item.quantity}</p>
                      <p className="font-semibold text-secondary">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-primary/10 bg-surface p-6">
              <h3 className="text-lg font-semibold text-primary">Informasi Pembeli</h3>
              <div className="mt-4 space-y-4 text-sm text-foreground">
                <div>
                  <label className="mb-2 block font-medium text-muted">Nama Lengkap</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-medium text-muted">Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    placeholder="email@domain.com"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-medium text-muted">No. Telepon</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    placeholder="0812xxxxxxx"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-medium text-muted">Alamat Lengkap</label>
                  <textarea
                    value={customerAddress}
                    onChange={(event) => setCustomerAddress(event.target.value)}
                    placeholder="Jalan, kelurahan, kecamatan, kota, provinsi"
                    className="w-full min-h-25 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-medium text-muted">Layanan Pengiriman</label>
                  <select
                    value={shippingService}
                    onChange={(event) => setShippingService(event.target.value as ShippingService)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                  >
                    {services.map((svc) => (
                      <option key={svc.label} value={svc.label}>
                        {svc.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6 rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-primary">Ringkasan Pembayaran</h2>
            </div>

            <div className="space-y-4 rounded-3xl bg-surface-dark p-5">
              <div className="flex items-center justify-between text-sm text-muted">
                <span>Total Item</span>
                <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted">
                <span>Biaya Pengiriman ({detectedDestination})</span>
                <span>{formatPrice(shippingFee)}</span>
              </div>
              <div className="border-t border-slate-700 pt-4 text-lg font-semibold text-primary flex items-center justify-between">
                <span>Total Pembayaran</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={isCreating || !isFormValid}
              >
                {isCreating ? "Membuat Transaksi..." : "Bayar Sekarang"}
              </Button>
              <Button href="/cart" variant="outline" className="w-full">
                Kembali ke Keranjang
              </Button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-surface p-4 text-sm text-foreground">
              <p className="font-semibold text-primary">Status Transaksi</p>
              <p className="mt-2 text-sm text-muted">{checkoutStatus}</p>
            </div>

            {checkoutError ? (
              <div className="rounded-3xl border border-red-500/20 bg-red-50 p-4 text-sm text-red-700">
                {checkoutError}
              </div>
            ) : null}

            {qrCodeUrl ? (
              <div className="rounded-3xl border border-primary/10 bg-white p-5 shadow-sm">
                <p className="font-semibold text-primary">QRIS Pembayaran</p>
                <p className="mt-2 text-sm text-muted">Snap atau scan kode berikut untuk melakukan pembayaran.</p>
                <div className="mt-4 flex items-center justify-center rounded-3xl bg-slate-50 p-6">
                  <img
                    src={qrCodeUrl}
                    alt="QRIS Pembayaran"
                    className="h-auto w-full max-w-65 object-contain"
                  />
                </div>
                <p className="mt-4 text-xs text-muted">
                  Transaksi ID: <span className="font-semibold text-foreground">{transactionId}</span>
                </p>
              </div>
            ) : null}

            <div className="rounded-3xl bg-slate-950 p-5 text-sm text-slate-300">
              <p className="font-semibold text-slate-100">Catatan Pembayaran</p>
              <ul className="mt-3 space-y-2">
                <li>1. Scan QRIS di atas untuk menyelesaikan pembayaran.</li>
                <li>2. Simpan bukti pembayaran dan konfirmasi melalui WhatsApp.</li>
                <li>3. Pesanan akan diproses setelah pembayaran terverifikasi.</li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </Section>
  );
}
