"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

type Order = {
  id: string;
  order_id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  subtotal?: number;
  total_amount?: number;
  status: string;
  created_at: string;
};

const getStatusBadgeClasses = (status: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "paid") return "bg-emerald-100 text-emerald-700";
  if (normalized === "pending") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAuthenticated(localStorage.getItem("admin-authenticated") === "true");
    }
    setCheckedAuth(true);
  }, []);

  useEffect(() => {
    if (!checkedAuth) return;
    if (!isAuthenticated) {
      router.push("/admin");
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/orders");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Gagal mengambil pesanan dari API");
        }

        setOrders(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message || "Terjadi kesalahan saat memuat pesanan.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [checkedAuth, isAuthenticated, router]);

  const handleViewOrderDetail = (order: Order) => {
    const orderId = order.order_id || order.id;
    router.push(`/admin/orders/${encodeURIComponent(orderId)}`);
  };

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-bold">Daftar Pesanan Admin</h1>

      {!checkedAuth ? (
        <p className="mt-4 text-sm text-slate-500">Memeriksa akses admin...</p>
      ) : !isAuthenticated ? (
        <p className="mt-4 text-sm text-slate-500">
          Silakan login sebagai admin terlebih dahulu di <a href="/admin" className="text-primary underline">/admin</a>.
        </p>
      ) : loading ? (
        <p className="mt-4 text-sm text-slate-500">Memuat pesanan...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-rose-600">{error}</p>
      ) : orders.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Tidak ada pesanan pending saat ini.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <table className="min-w-[900px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-700">ID Pesanan</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Nama Pelanggan</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Total Harga</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Tanggal Dibuat</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id || order.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-4 font-medium text-slate-900">{order.order_id}</td>
                  <td className="px-4 py-4 text-slate-700">{order.customer_name || "-"}</td>
                  <td className="px-4 py-4 text-slate-700">{order.customer_email || "-"}</td>
                  <td className="px-4 py-4 text-slate-700">{order.subtotal !== undefined ? formatPrice(order.subtotal) : "-"}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getStatusBadgeClasses(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{new Date(order.created_at).toLocaleString("id-ID")}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <button
                        onClick={() => handleViewOrderDetail(order)}
                        className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => window.open(`/api/orders/${encodeURIComponent(order.order_id || order.id)}/receipt`, "_blank")}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                      >
                        Cetak Resi
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
