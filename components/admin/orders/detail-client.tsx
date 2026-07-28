"use client";

import { useState } from "react";
import { AlertCircle, PackageX, Printer } from "lucide-react";
import { useOrderDetail } from "@/hooks/use-order-detail";
import { useOrderActions } from "@/hooks/use-order-actions";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { AdminBadge, AdminButton, AdminKeyValue } from "@/components/admin/ui";
import { AdminSection, AdminPageHeader, AdminEmptyLayout } from "@/components/admin/patterns";
import {
  paymentBadgeVariant,
  fulfillmentBadgeVariant,
  shippingBadgeVariant,
  paymentStatusLabel,
  fulfillmentStatusLabel,
  shippingStatusLabel,
} from "./status-maps";
import { StatusCards } from "./status-cards";
import { CustomerSection } from "./customer-section";
import { ItemsSection } from "./items-section";
import { OrderTimeline } from "./order-timeline";
import { OrderActions } from "./order-actions";
import { AdminNotes } from "./admin-notes";
import { TrackingPanel } from "./tracking-panel";
import { ActionBanner } from "./action-banner";

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
      <div className="mb-8 h-8 w-48 animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="animate-pulse space-y-6 lg:col-span-3 xl:col-span-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-28 rounded-3xl bg-slate-200" />
            <div className="h-28 rounded-3xl bg-slate-200" />
            <div className="h-28 rounded-3xl bg-slate-200" />
          </div>
          <div className="h-40 rounded-3xl bg-slate-200" />
          <div className="h-32 rounded-3xl bg-slate-200" />
          <div className="h-52 rounded-3xl bg-slate-200" />
          <div className="h-64 rounded-3xl bg-slate-200" />
        </div>
        <div className="animate-pulse space-y-6 lg:col-span-2 xl:col-span-1">
          <div className="h-32 rounded-3xl bg-slate-200" />
          <div className="h-40 rounded-3xl bg-slate-200" />
          <div className="h-48 rounded-3xl bg-slate-200" />
          <div className="h-40 rounded-3xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface DetailClientProps {
  id: string;
}

export function OrderDetailClient({ id }: DetailClientProps) {
  const { order, loading, error, refresh } = useOrderDetail(id);
  const { execute: executeAction, loading: actionLoading } = useOrderActions();
  const { showToast } = useToast();
  const [timelineKey, setTimelineKey] = useState(0);

  const handleOrderUpdate = () => {
    refresh();
    setTimelineKey((k) => k + 1);
  };

  const handleResume = async () => {
    if (!order) return;
    const result = await executeAction(order.order_id, "confirm");
    if (result.success) {
      showToast("Pesanan berhasil dilanjutkan.", "success");
      handleOrderUpdate();
    } else {
      showToast(result.error ?? "Gagal melanjutkan pesanan.", "error");
    }
  };

  if (loading) return <DetailSkeleton />;

  if (error === "NOT_FOUND") {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
          <AdminEmptyLayout
            variant="empty"
            icon={<PackageX className="h-16 w-16" />}
            title="Pesanan Tidak Ditemukan"
            description="Pesanan dengan ID tersebut tidak ditemukan."
            action={
              <AdminButton variant="primary" href="/admin/orders">
                Kembali ke Orders
              </AdminButton>
            }
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
          <AdminEmptyLayout
            variant="error"
            icon={<AlertCircle className="h-16 w-16" />}
            title="Gagal Memuat Detail Pesanan"
            description={error}
            action={
              <AdminButton variant="primary" onClick={refresh}>
                Coba Lagi
              </AdminButton>
            }
          />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const items = order.order_items ?? [];

  const createdDate = (() => {
    const d = new Date(order.created_at);
    return d.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  })();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <AdminPageHeader
          title={order.order_id}
          subtitle={`${order.customer_name ?? "-"} \u00B7 ${createdDate}`}
          backHref="/admin/orders"
          backLabel="Back to Orders"
          badges={
            <>
              <AdminBadge variant={paymentBadgeVariant(order.payment_status)}>
                {paymentStatusLabel(order.payment_status)}
              </AdminBadge>
              <AdminBadge variant={fulfillmentBadgeVariant(order.fulfillment_status)}>
                {fulfillmentStatusLabel(order.fulfillment_status)}
              </AdminBadge>
              <AdminBadge variant={shippingBadgeVariant(order.shipping_status)}>
                {shippingStatusLabel(order.shipping_status)}
              </AdminBadge>
            </>
          }
          className="mb-6"
        />

        <ActionBanner
          fulfillmentStatus={order.fulfillment_status}
          items={items.map((item) => ({
            id: item.id,
            product_name: item.product_name,
            quantity: item.quantity,
            stock: item.products?.stock ?? 0,
          }))}
          onResume={handleResume}
          loading={actionLoading}
        />

        {/* Two-Column Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 xl:grid-cols-[1fr_380px]">
          {/* Left Column (~70%) */}
          <div className="space-y-6 lg:col-span-3 xl:col-auto">
            {/* Status Cards */}
            <StatusCards
              paymentStatus={order.payment_status}
              fulfillmentStatus={order.fulfillment_status}
              shippingStatus={order.shipping_status}
              paidAt={order.paid_at}
              shippedAt={order.shipped_at}
              completedAt={order.completed_at}
            />

            {/* Customer + Shipping */}
            <CustomerSection
              customerName={order.customer_name}
              customerEmail={order.customer_email}
              customerPhone={order.customer_phone}
              shippingAddress={order.shipping_address}
            />

            {/* Shipping Information */}
            <AdminSection title="Shipping Information">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AdminKeyValue label="Courier" value={order.courier_company ?? "-"} />
                <AdminKeyValue label="Service" value={order.courier_type ?? "-"} />
                <AdminKeyValue
                  label="Shipping Cost"
                  value={order.shipping_cost != null ? formatPrice(order.shipping_cost) : "-"}
                />
                <AdminKeyValue
                  label="Waybill"
                  value={
                    order.waybill_id ? (
                      <span className="font-mono">{order.waybill_id}</span>
                    ) : (
                      <span className="text-slate-400 italic">Tidak tersedia</span>
                    )
                  }
                />
              </div>
            </AdminSection>

            {/* Order Items */}
            <ItemsSection items={items} />

            {/* Timeline */}
            <OrderTimeline key={timelineKey} orderId={order.order_id} />
          </div>

          {/* Right Column (~30%) — Sticky */}
          <div className="space-y-6 lg:col-span-2 xl:col-auto">
            <div className="sticky top-6 space-y-6">
              {/* Order Actions */}
              <OrderActions
                orderId={order.order_id}
                fulfillmentStatus={order.fulfillment_status}
                paymentStatus={order.payment_status}
                shipmentId={order.shipment_id}
                onSuccess={handleOrderUpdate}
              />

              {/* Payment Summary */}
              <AdminSection title="Payment Summary">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-900">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Shipping</span>
                    <span className="text-slate-900">
                      {order.shipping_fee != null ? formatPrice(order.shipping_fee) : "-"}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">Grand Total</span>
                      <span className="text-lg font-bold text-slate-900">
                        {formatPrice(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </AdminSection>

              {/* Shipping Document / Receipt PDF */}
              {order.waybill_id && (
                <AdminSection title="Shipping Document">
                  <AdminButton
                    variant="primary"
                    href={`/api/admin/orders/${encodeURIComponent(order.order_id)}/receipt`}
                  >
                    <Printer className="h-4 w-4" />
                    Cetak Resi (PDF)
                  </AdminButton>
                </AdminSection>
              )}

              {/* Shipment Tracking */}
              <TrackingPanel
                orderId={order.order_id}
                waybillId={order.waybill_id}
                shippingStatus={order.shipping_status}
              />

              {/* Order Metadata */}
              <AdminSection title="Order Metadata">
                <div className="space-y-3">
                  <AdminKeyValue label="Created At" value={formatDate(order.created_at)} />
                  <AdminKeyValue label="Updated At" value={formatDate(order.updated_at)} />
                  <AdminKeyValue label="Paid At" value={formatDate(order.paid_at)} />
                  <AdminKeyValue label="Completed At" value={formatDate(order.completed_at)} />
                  <AdminKeyValue label="Shipped At" value={formatDate(order.shipped_at)} />
                  <AdminKeyValue label="Cancelled At" value={formatDate(order.cancelled_at)} />
                  <AdminKeyValue label="Payment Method" value={order.payment_method ?? "-"} />
                  <AdminKeyValue label="Transaction ID" value={order.transaction_id ?? "-"} />
                </div>
              </AdminSection>

              {/* Admin Notes */}
              <AdminNotes
                orderId={order.order_id}
                initialNotes={order.admin_notes}
                onSuccess={handleOrderUpdate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
