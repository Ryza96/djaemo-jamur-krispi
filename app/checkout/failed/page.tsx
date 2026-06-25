"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageHeader, Section } from "@/components/sections/Section";
import type { Order } from "@/types";

const ORDER_STORAGE_KEY = "djaemo-last-order";

export default function CheckoutFailedPage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    try {
      const stored = window.localStorage.getItem(ORDER_STORAGE_KEY);
      setOrder(stored ? (JSON.parse(stored) as Order) : null);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const orderId = order?.orderId;

  if (loading) {
    return (
      <Section>
        <PageHeader
          title="Pembayaran Gagal"
          description="Sedang memuat detail pesanan..."
        />
        <div className="rounded-3xl border border-primary/10 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-muted">Mohon tunggu.</p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <PageHeader
        title="Pembayaran dibatalkan"
        description="Silakan coba lagi. Jika dana sudah terpotong, silakan menunggu konfirmasi dari bank/issuer."
      />

      <div className="grid gap-10 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6 rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-primary">Status Transaksi</h2>
            <p className="text-sm text-muted">{order?.status || "failed"}</p>
          </div>

          {orderId ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-50 p-4 text-sm text-red-700">
              Nomor Pesanan: <span className="font-semibold">{orderId}</span>
            </div>
          ) : (
            <div className="rounded-3xl border border-red-500/20 bg-red-50 p-4 text-sm text-red-700">
              Nomor pesanan tidak ditemukan di penyimpanan browser.
            </div>
          )}

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/cart")}
            >
              Kembali ke Keranjang
            </Button>
            <Button className="w-full" onClick={() => router.push("/produk")}
            >
              Pilih Produk Lagi
            </Button>
          </div>
        </div>

        <aside className="space-y-6 rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
          <div className="rounded-3xl bg-slate-950 p-5 text-sm text-slate-300">
            <p className="font-semibold text-slate-100">Catatan</p>
            <ul className="mt-3 space-y-2">
              <li>1. Pastikan kamu memilih metode pembayaran dengan benar.</li>
              <li>2. Jika pembatalan terjadi karena batas waktu, silakan ulang checkout.</li>
              <li>3. Jika masih bermasalah, hubungi layanan pelanggan.</li>
            </ul>
          </div>
        </aside>
      </div>
    </Section>
  );
}

