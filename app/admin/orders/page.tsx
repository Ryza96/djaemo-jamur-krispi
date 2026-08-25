"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { OrderToolbar } from "@/components/admin/orders/toolbar";
import { OrderTable } from "@/components/admin/orders/table";
import { OrderCard } from "@/components/admin/orders/card";
import { OrderPagination } from "@/components/admin/orders/pagination";
import { OrderSkeleton } from "@/components/admin/orders/skeleton";
import { AdminPageHeader } from "@/components/admin/patterns/AdminPageHeader";
import { AdminEmptyLayout } from "@/components/admin/patterns/AdminEmptyLayout";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { useOrders } from "@/hooks/use-orders";
import { FULFILLMENT_STATUS_OPTIONS } from "@/components/admin/orders/types";

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

  // Deep-link support: /admin/orders?fulfillment_status=waiting_for_restock
  // (linked from the dashboard restock alert) seeds the fulfillment filter.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = new URLSearchParams(window.location.search).get(
      "fulfillment_status",
    );
    if (
      value &&
      FULFILLMENT_STATUS_OPTIONS.some((opt) => opt.value === value)
    ) {
      setFilters((prev) =>
        prev.fulfillment_status === value
          ? prev
          : { ...prev, fulfillment_status: value, page: 1 },
      );
    }
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
