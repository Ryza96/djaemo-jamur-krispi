"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Inbox } from "lucide-react";
import { OrderToolbar } from "@/components/admin/orders/toolbar";
import { OrderTable } from "@/components/admin/orders/table";
import { OrderCard } from "@/components/admin/orders/card";
import { OrderPagination } from "@/components/admin/orders/pagination";
import { OrderSkeleton } from "@/components/admin/orders/skeleton";
import { AdminPageHeader } from "@/components/admin/patterns/AdminPageHeader";
import { AdminEmptyLayout } from "@/components/admin/patterns/AdminEmptyLayout";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { useOrders } from "@/hooks/use-orders";
import { PAYMENT_STATUS_OPTIONS, FULFILLMENT_STATUS_OPTIONS } from "@/components/admin/orders/types";

export default function AdminOrdersPage() {
  const router = useRouter();
  const {
    orders,
    total,
    totalPages,
    loading,
    error,
    filters,
    setFilters,
    refresh,
  } = useOrders();

  // Jumlah order COD yang sudah delivered tapi belum dikonfirmasi lunas.
  // Kendala: list ini server-side pagination (limit 20 via useOrders) sehingga
  // .filter() pada `orders` tidak mewakili total → hitung via endpoint list
  // yang sudah ada (limit=1, baca `total`) — tanpa query/route baru.
  const [codAwaitingCount, setCodAwaitingCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "1",
          sort: "newest",
          payment_status: "cod_awaiting_confirmation",
          fulfillment_status: "delivered",
          payment_method: "cod",
        });
        const res = await fetch(`/api/admin/orders?${params.toString()}`);
        if (!res.ok) return;
        const json = (await res.json()) as { success?: boolean; total?: number };
        if (!cancelled && json.success && typeof json.total === "number") {
          setCodAwaitingCount(json.total);
        }
      } catch {
        if (!cancelled) setCodAwaitingCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Deep-link support for dashboard alerts:
  // /admin/orders?fulfillment_status=waiting_for_restock (restock alert)
  // /admin/orders?fulfillment_status=confirmed (shipping alert)
  // /admin/orders?payment_status=failed (payment alert)
  // seeds the matching toolbar filter.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fStatus = params.get("fulfillment_status");
    const pStatus = params.get("payment_status");

    setFilters((prev) => {
      let next = prev;
      if (
        fStatus &&
        FULFILLMENT_STATUS_OPTIONS.some((opt) => opt.value === fStatus)
      ) {
        next =
          prev.fulfillment_status === fStatus
            ? next
            : { ...next, fulfillment_status: fStatus, page: 1 };
      }
      if (
        pStatus &&
        PAYMENT_STATUS_OPTIONS.some((opt) => opt.value === pStatus)
      ) {
        next =
          next.payment_status === pStatus
            ? next
            : { ...next, payment_status: pStatus, page: 1 };
      }
      return next;
    });
  }, [setFilters]);

  const handleView = (orderId: string) => {
    router.push(`/admin/orders/${encodeURIComponent(orderId)}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <AdminPageHeader
          title="Orders"
          subtitle="Manage customer orders"
          className="mb-6"
        />

        <div className="mb-4">
          <OrderToolbar filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Penanda jumlah: COD delivered tapi belum konfirmasi lunas (tampilan saja). */}
        {codAwaitingCount !== null && codAwaitingCount > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">
                COD menunggu pelunasan
              </p>
              <p className="text-[13px] text-amber-700">
                Paket sudah sampai, uang belum dikonfirmasi
              </p>
            </div>
            <AdminBadge variant="warning" size="lg" dot={false} uppercase={false}>
              {codAwaitingCount}
            </AdminBadge>
          </div>
        )}

        {loading ? (
          <OrderSkeleton />
        ) : error ? (
          <AdminEmptyLayout
            variant="error"
            icon={<AlertCircle className="h-16 w-16" />}
            title="Gagal Memuat Data"
            description={error}
            action={
              <AdminButton onClick={refresh} size="lg">
                Coba Lagi
              </AdminButton>
            }
          />
        ) : orders.length === 0 ? (
          <AdminEmptyLayout
            variant="empty"
            icon={<Inbox className="h-16 w-16" />}
            title="Tidak Ada Pesanan"
            description="Belum ada pesanan yang sesuai dengan filter yang dipilih."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <OrderTable orders={orders} onView={handleView} />
            </div>
            <div className="space-y-3 md:hidden">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} onView={handleView} />
              ))}
            </div>
            <div className="mt-4">
              <OrderPagination
                page={filters.page}
                totalPages={totalPages}
                total={total}
                limit={filters.limit}
                onPageChange={(p) =>
                  setFilters((prev) => ({ ...prev, page: p }))
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
