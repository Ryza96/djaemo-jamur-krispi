"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

const ORDER_STORAGE_KEY = "djaemo-last-order";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(ORDER_STORAGE_KEY) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Order;
        setOrder(parsed);
      } catch {
        setOrder(null);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Section>
        <PageHeader title="Checkout Berhasil" description="Memuat detail pesanan Anda..." />
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-muted">Sedang memuat informasi pesanan.</p>
        </div>
      </Section>
    );
  }

  if (!order) {
    return (
      <Section>
        <PageHeader
          title="Pesanan Tidak Ditemukan"
          description="Tidak ada detail pesanan yang tersimpan. Silakan lakukan checkout kembali."
        />
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-primary">Belum ada pesanan terakhir.</p>
          <p className="mt-3 text-sm text-muted">
            Data pesanan tidak ditemukan pada penyimpanan browser Anda.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => router.push("/produk")} className="w-full sm:w-auto">
              Kembali ke Produk
            </Button>
            <Button variant="outline" onClick={() => router.push("/cart")} className="w-full sm:w-auto">
              Lihat Keranjang
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Section>
      <PageHeader
        title="Checkout Berhasil"
        description="Order Anda telah disimpan. Silakan gunakan QRIS untuk menyelesaikan pembayaran."
      />

      <div className="grid gap-10 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6 rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-primary">Nomor Pesanan</h2>
            <p className="text-sm text-muted">{order.orderId}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <p className="text-sm text-muted">Status</p>
                <p className="font-semibold text-foreground">{order.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Dibuat pada</p>
                <p className="font-semibold text-foreground">{formattedDate}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-surface p-5">
            <h3 className="text-base font-semibold text-primary">Informasi Pembeli</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted">Nama</p>
                <p className="font-semibold text-foreground">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Email</p>
                <p className="font-semibold text-foreground">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Telepon</p>
                <p className="font-semibold text-foreground">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Alamat</p>
                <p className="font-semibold text-foreground">{order.customerAddress}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h3 className="text-base font-semibold text-primary">Barang Pesanan</h3>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
                  <div>
                    <p className="font-semibold text-foreground">{item.product.name}</p>
                    <p className="text-sm text-muted">Jumlah: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-primary">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6 rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
          <div className="space-y-4 rounded-3xl bg-surface-dark p-5">
            <div className="text-sm text-muted">Total Bayar</div>
            <div className="text-3xl font-semibold text-primary">{formatPrice(order.subtotal)}</div>
          </div>

          <div className="rounded-3xl border border-primary/10 bg-white p-5 shadow-sm">
            <p className="font-semibold text-primary">QRIS Pembayaran</p>
            <p className="mt-2 text-sm text-muted">Tunjukkan atau scan kode di bawah untuk menyelesaikan pembayaran.</p>
            {order.qrCodeUrl ? (
              <div className="mt-5 flex items-center justify-center rounded-3xl bg-slate-50 p-6">
                <img src={order.qrCodeUrl} alt="QRIS Pembayaran" className="h-auto w-full max-w-65 object-contain" />
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-muted">
                QRIS belum tersedia. Silakan hubungi layanan pelanggan.
              </div>
            )}
            <p className="mt-4 text-xs text-muted">
              Transaksi ID: <span className="font-semibold text-foreground">{order.transactionId}</span>
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950 p-5 text-sm text-slate-300">
            <p className="font-semibold text-slate-100">Petunjuk Selanjutnya</p>
            <ul className="mt-3 space-y-2">
              <li>1. Scan QRIS di atas untuk menyelesaikan pembayaran.</li>
              <li>2. Simpan tangkapan layar sebagai bukti pemesanan.</li>
              <li>3. Setelah pembayaran, pesanan akan diproses lebih lanjut.</li>
            </ul>
          </div>

          <Button className="w-full" onClick={() => router.push("/")}>Kembali ke Beranda</Button>
        </aside>
      </div>
    </Section>
  );
}
