"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const summaryCards = useMemo(
    () => [
      {
        title: "Total Penjualan",
        value: revenueLoading ? "Loading..." : `Rp ${totalRevenue.toLocaleString('id-ID')}`,
        description: "Bulan ini",
        accent: "bg-emerald-50 text-emerald-700",
      },
      {
        title: "Pesanan Baru",
        value: pendingCount.toString(),
        description: "Menunggu konfirmasi",
        accent: "bg-sky-50 text-sky-700",
      },
      {
        title: "Stok Menipis",
        value: "4 Produk",
        description: "Segera restock",
        accent: "bg-amber-50 text-amber-700",
      },
      {
        title: "Total Pelanggan",
        value: "1.540",
        description: "Terdaftar aktif",
        accent: "bg-violet-50 text-violet-700",
      },
    ],
    [totalRevenue, revenueLoading, pendingCount]
  );

  // Fetch dashboard stats: total revenue (paid) and pending count
  const fetchDashboardData = async () => {
    try {
      setRevenueLoading(true);

      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error(`Failed to fetch /api/orders (${res.status})`);
      const payload = await res.json();

      // /api/orders mengembalikan shape: { success: true, data: orders }
      // Pastikan payload.data selalu array sebelum dipakai .filter/.reduce.
      const data = payload?.data;
      const orders = Array.isArray(data) ? data : [];

      // total revenue untuk transaksi yang sudah dibayar
      const revenueStatuses = new Set(['paid']);

      const total = orders
        .filter((r: any) => revenueStatuses.has((r?.payment_status ?? '').toString().toLowerCase()))
        .reduce(
          (s: number, r: any) =>
            s + (Number(r.subtotal ?? r.total_amount ?? r.total ?? 0) || 0),
          0
        );
      setTotalRevenue(total);


      // pending count (payment_status 'pending')
      const pendingCnt = orders.filter((r: any) => (r.payment_status || '').toString().toLowerCase() === 'pending').length;
      setPendingCount(pendingCnt);

    } catch (err: any) {
      console.error('fetchDashboardData error:', err);
    } finally {
      setRevenueLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;

    // Placeholder init Chart.js. Replace dengan Chart.js real implementation.
    // import("chart.js").then(({ Chart, registerables }) => {
    //   Chart.register(...registerables);
    //   new Chart(ctx, {
    //     type: "line",
    //     data: {
    //       labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    //       datasets: [
    //         {
    //           label: "Penjualan",
    //           data: [1500000, 2300000, 1800000, 2100000, 2500000, 2200000, 2700000],
    //           tension: 0.4,
    //           borderColor: "#4f46e5",
    //           backgroundColor: "rgba(79, 70, 229, 0.18)",
    //         },
    //       ],
    //     },
    //     options: {
    //       responsive: true,
    //       plugins: {
    //         legend: { display: false },
    //       },
    //       scales: {
    //         y: { beginAtZero: true },
    //       },
    //     },
    //   });
    // });
  }, []);

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.title} className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200">
            <div className={`inline-flex rounded-2xl px-3 py-1 text-xs font-semibold ${card.accent}`}>{card.title}</div>
            <p className="mt-6 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Grafik Penjualan</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Performanya minggu ini</h3>
            </div>
            <span className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">Marketplace</span>
          </div>
          <div className="rounded-4xl border border-slate-200 bg-slate-50 p-4">
            <canvas ref={chartRef} className="h-80 w-full" aria-label="Penjualan mingguan" />
            <div className="mt-4 rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm shadow-slate-100">
              <p className="font-medium text-slate-900">Chart.js placeholder</p>
              <p className="mt-2">Script Chart.js bisa dihubungkan di sini, lalu gunakan data penjualan mingguan untuk menampilkan tren.</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Ringkasan stok</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Produk hampir habis</h3>
            </div>
            <button className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white transition hover:bg-slate-800">Kelola Stok</button>
          </div>
          <div className="space-y-4">
            {[
              { label: "Jamur Krispi Balado 100g", stock: "12 paket" },
              { label: "Jamur Krispi Original 150g", stock: "8 paket" },
              { label: "Jamur Krispi Keju 100g", stock: "6 paket" },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">Sisa stok kritis</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">{item.stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Operational Alerts</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Yang perlu diperhatikan</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push('/admin/orders')}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-lg">📦</span>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-sky-700">Pesanan Baru</p>
                <p className="text-sm text-slate-500">{pendingCount} menunggu konfirmasi</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push('/admin/orders')}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-amber-200 hover:bg-amber-50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">🚚</span>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-amber-700">Pengiriman Tertunda</p>
                <p className="text-sm text-slate-500">Cek daftar pengiriman</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push('/admin/products')}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-rose-200 hover:bg-rose-50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-lg">⚠️</span>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-rose-700">Stok Menipis</p>
                <p className="text-sm text-slate-500">Segera restock</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push('/admin/orders')}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-red-200 hover:bg-red-50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-lg">❌</span>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-red-700">Masalah Pembayaran</p>
                <p className="text-sm text-slate-500">Cek pembayaran gagal</p>
              </div>
            </div>
          </button>
        </div>
      </section>
    </>
  );
}
