"use client";

import type { OrderListItem } from "./types";
import { formatPrice } from "@/lib/utils";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminSection } from "@/components/admin/patterns/AdminSection";
import { paymentBadgeVariant, fulfillmentBadgeVariant, paymentStatusLabel, fulfillmentStatusLabel } from "./status-maps";

interface OrderCardProps {
  order: OrderListItem;
  onView: (orderId: string) => void;
}

export function OrderCard({ order, onView }: OrderCardProps) {
  return (
    <AdminSection padding="sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="font-mono text-xs text-slate-500">
            {order.order_id}
          </div>
          <div className="mt-0.5 font-medium text-slate-900">
            {order.customer_name ?? "-"}
          </div>
        </div>
        <AdminButton
          variant="ghost"
          size="sm"
          onClick={() => onView(order.order_id)}
        >
          View →
        </AdminButton>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="mb-0.5 text-xs text-slate-500">Date</div>
          <div className="text-slate-700">
            {new Date(order.created_at).toLocaleDateString("id-ID", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
        <div>
          <div className="mb-0.5 text-xs text-slate-500">Total</div>
          <div className="font-semibold text-slate-900">
            {formatPrice(order.total_amount)}
          </div>
        </div>
        <div>
          <div className="mb-0.5 text-xs text-slate-500">Payment</div>
          <AdminBadge
            variant={paymentBadgeVariant(order.payment_status)}
            size="sm"
          >
            {paymentStatusLabel(order.payment_status)}
          </AdminBadge>
        </div>
        <div>
          <div className="mb-0.5 text-xs text-slate-500">Fulfillment</div>
          <AdminBadge
            variant={fulfillmentBadgeVariant(order.fulfillment_status)}
            size="sm"
          >
            {fulfillmentStatusLabel(order.fulfillment_status)}
          </AdminBadge>
        </div>
      </div>
      {order.waybill_id && (
        <div className="mt-3 text-xs text-slate-500">
          Waybill:{" "}
          <span className="font-mono text-slate-700">{order.waybill_id}</span>
        </div>
      )}
    </AdminSection>
  );
}
