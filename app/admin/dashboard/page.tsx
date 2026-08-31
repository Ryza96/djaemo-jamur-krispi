"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardStats {
  revenue: number;
  pendingOrders: number;
  totalCustomers: number;
  lowStockCount: number;
  lowStockItems: Array<{ name: string; stock: number }>;
  weeklySales: Array<{ date: string; total: number }>;
  periodLabel: string;
  waitingRestockCount: number;
}

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function AdminDashboardPage() {
  const router = useRouter();
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(false);
        const res = await fetch("/api/admin/dashboard/stats");
        if (res.status === 401) {
          router.replace("/admin");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setStats(json.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Dashboard stats error:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [router]);

  const summaryCards = useMemo(() => {
    const revenue = stats?.revenue ?? 0;
    const pending = stats?.pendingOrders ?? 0;
    const lowStock = stats?.lowStockCount ?? 0;
    const customers = stats?.totalCustomers ?? 0;
    const period = stats?.periodLabel ?? "Bulan ini";

    return [
      {
        title: "Total Penjualan",
        value: loading ? "Loading..." : `Rp ${revenue.toLocaleString("id-ID")}`,
        description: period,
        accent: "bg-emerald-50 text-emerald-700",
      },
      {
        title: "Pesanan Baru",
        value: loading ? "..." : pending.toString(),
        description: "Menunggu konfirmasi",
        accent: "bg-sky-50 text-sky-700",
      },
      {
        title: "Stok Menipis",
        value: loading ? "..." : `${lowStock} Produk`,
        description: "Segera restock",
        accent: "bg-amber-50 text-amber-700",
      },
      {
        title: "Total Pelanggan",
        value: loading ? "..." : customers.toLocaleString("id-ID"),
        description: "Terdaftar aktif",
        accent: "bg-violet-50 text-violet-700",
      },
    ];
  }, [stats, loading]);

  useEffect(() => {
    const canvas = chartRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !stats?.weeklySales?.length) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const PAD = { top: 20, right: 20, bottom: 40, left: 70 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    const values = stats.weeklySales.map((d) => d.total);
    const maxVal = Math.max(...values, 1);
    const labels = stats.weeklySales.map((d) => {
      const date = new Date(d.date + "T00:00:00");
      return DAY_NAMES[date.getDay()];
    });

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(PAD.left, PAD.top + chartH, chartW, 1);

    const step = chartW / values.length;
    const barW = step * 0.5;

    values.forEach((val, i) => {
      const x = PAD.left + i * step + (step - barW) / 2;
      const barH = (val / maxVal) * chartH;
      const y = PAD.top + chartH - barH;

      ctx.fillStyle = "rgba(79, 70, 229, 0.18)";
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 4);
      ctx.fill();

      ctx.fillStyle = "#4f46e5";
      ctx.beginPath();
      ctx.roundRect(x, y, barW, Math.min(barH, 4), 4);
      ctx.fill();

      ctx.fillStyle = "#64748b";
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(labels[i], x + barW / 2, PAD.top + chartH + 20);

      if (val > 0) {
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        const label = val >= 1_000_000
          ? `${(val / 1_000_000).toFixed(1)}jt`
          : val >= 1_000
            ? `${(val / 1_000).toFixed(0)}rb`
            : String(val);
        ctx.fillText(label, x + barW / 2, y - 6);
      }
    });
  }, [stats]);

  return (
    <>
      {!loading && (stats?.waitingRestockCount ?? 0) > 0 && (
        <section
          role="alert"
          className="rounded-3xl border border-amber-300 bg-amber-50 p-5 shadow-sm shadow-amber-200/50 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 animate-pulse items-center justify-center rounded-2xl bg-amber-100 text-xl">
                ⚠️
              </span>
              <div>
                <p className="font-semibold text-amber-900">
                  {stats?.waitingRestockCount} pesanan terbayar menunggu restok
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Stok produk belum tersedia. Segera lakukan restok agar pesanan dapat diproses.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/admin/orders?fulfillment_status=waiting_for_restock")}
              className="shrink-0 rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Lihat Pesanan
            </button>
          </div>
        </section>
      )}

      {!loading && error && (
        <section
          role="alert"
          className="rounded-3xl border border-rose-300 bg-rose-50 p-5 shadow-sm shadow-rose-200/50 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-xl">
                ⚠️
              </span>
              <div>
                <p className="font-semibold text-rose-900">Gagal memuat data dashboard</p>
                <p className="mt-1 text-sm text-rose-800">
                  Tidak dapat mengambil data statistik. Angka di bawah mungkin tidak
                  akurat. Coba muat ulang halaman.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="shrink-0 rounded-2xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              Muat Ulang
            </button>
          </div>
        </section>
      )}

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
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Penjualan per hari (pembayaran diterima)</h3>
            </div>
            {/* TODO: Marketplace filter — belum ada logic filter, placeholder statsis. Aktifkan kalau sudah ada kolom sales_channel di tabel orders. */}
            {/* <span className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">Marketplace</span> */}
          </div>
          <div className="rounded-4xl border border-slate-200 bg-slate-50 p-4">
            <canvas ref={chartRef} className="h-80 w-full" aria-label="Penjualan mingguan" />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Ringkasan stok</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Produk hampir habis</h3>
            </div>
            <button
              onClick={() => router.push("/admin/products")}
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
            >
              Kelola Stok
            </button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Memuat data stok...</p>
            ) : stats?.lowStockItems && stats.lowStockItems.length > 0 ? (
              stats.lowStockItems.map((item) => (
                <div key={item.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">Sisa stok kritis</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">{item.stock} paket</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Semua stok aman.</p>
            )}
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
            onClick={() => router.push("/admin/orders")}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-lg">📦</span>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-sky-700">Pesanan Baru</p>
                <p className="text-sm text-slate-500">{stats?.pendingOrders ?? 0} menunggu konfirmasi</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push("/admin/orders?fulfillment_status=confirmed")}
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
            onClick={() => router.push("/admin/products")}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-rose-200 hover:bg-rose-50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-lg">⚠️</span>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-rose-700">Stok Menipis</p>
                <p className="text-sm text-slate-500">{stats?.lowStockCount ?? 0} produk perlu restock</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push("/admin/orders?payment_status=failed")}
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
          <button
            onClick={() => router.push("/admin/orders?fulfillment_status=waiting_for_restock")}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-amber-200 hover:bg-amber-50"
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${(stats?.waitingRestockCount ?? 0) > 0 ? "animate-pulse bg-amber-100" : "bg-slate-100"}`}>⏸️</span>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-amber-700">Menunggu Restok</p>
                <p className="text-sm text-slate-500">{stats?.waitingRestockCount ?? 0} pesanan tertahan stok</p>
              </div>
            </div>
          </button>
        </div>
      </section>
    </>
  );
}
