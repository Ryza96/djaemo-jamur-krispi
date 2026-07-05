"use client";

import { AdminBadge } from "@/components/admin/ui";
import { AdminSection } from "@/components/admin/patterns";
import {
  paymentBadgeVariant,
  fulfillmentBadgeVariant,
  shippingBadgeVariant,
} from "./status-maps";

function formatDate(date: string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface StatusCardsProps {
  paymentStatus: string | null;
  fulfillmentStatus: string | null;
  shippingStatus: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
}

export function StatusCards({
  paymentStatus,
  fulfillmentStatus,
  shippingStatus,
  paidAt,
  shippedAt,
  completedAt,
}: StatusCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AdminSection padding="sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Payment
        </div>
        <AdminBadge variant={paymentBadgeVariant(paymentStatus)}>
          {paymentStatus ?? "-"}
        </AdminBadge>
        {paidAt && (
          <div className="mt-3 text-xs text-slate-400">
            Paid: {formatDate(paidAt)}
          </div>
        )}
      </AdminSection>

      <AdminSection padding="sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Fulfillment
        </div>
        <AdminBadge variant={fulfillmentBadgeVariant(fulfillmentStatus)}>
          {fulfillmentStatus ?? "-"}
        </AdminBadge>
        {shippedAt && (
          <div className="mt-3 text-xs text-slate-400">
            Shipped: {formatDate(shippedAt)}
          </div>
        )}
        {completedAt && !shippedAt && (
          <div className="mt-3 text-xs text-slate-400">
            Completed: {formatDate(completedAt)}
          </div>
        )}
      </AdminSection>

      <AdminSection padding="sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Shipping
        </div>
        <AdminBadge variant={shippingBadgeVariant(shippingStatus)}>
          {shippingStatus ?? "-"}
        </AdminBadge>
      </AdminSection>
    </div>
  );
}
