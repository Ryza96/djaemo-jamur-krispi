"use client";

import type { OrderListItem } from "./types";
import { formatPrice } from "@/lib/utils";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import {
  AdminTable,
  AdminTableHead,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/patterns/AdminTable";
import { paymentBadgeVariant, fulfillmentBadgeVariant, paymentStatusLabel, fulfillmentStatusLabel } from "./status-maps";

interface OrderTableProps {
  orders: OrderListItem[];
  onView: (orderId: string) => void;
}

export function OrderTable({ orders, onView }: OrderTableProps) {
  return (
    <AdminTable>
      <AdminTableHead>
        <AdminTableHeader>Order ID</AdminTableHeader>
        <AdminTableHeader>Customer</AdminTableHeader>
        <AdminTableHeader>Date</AdminTableHeader>
        <AdminTableHeader>Total</AdminTableHeader>
        <AdminTableHeader>Payment</AdminTableHeader>
        <AdminTableHeader>Fulfillment</AdminTableHeader>
        <AdminTableHeader>Courier</AdminTableHeader>
        <AdminTableHeader>Action</AdminTableHeader>
      </AdminTableHead>
      <AdminTableBody>
        {orders.map((order) => (
          <AdminTableRow key={order.id}>
            <AdminTableCell>
              <span className="font-mono text-xs font-medium text-slate-900">
                {order.order_id}
              </span>
            </AdminTableCell>
            <AdminTableCell>
              <div className="font-medium text-slate-900">
                {order.customer_name ?? "-"}
              </div>
              <div className="text-xs text-slate-500">
                {order.customer_email ?? ""}
              </div>
            </AdminTableCell>
            <AdminTableCell className="whitespace-nowrap text-slate-600">
              {new Date(order.created_at).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </AdminTableCell>
            <AdminTableCell className="whitespace-nowrap font-medium text-slate-900">
              {formatPrice(order.total_amount)}
            </AdminTableCell>
            <AdminTableCell>
              <AdminBadge
                variant={paymentBadgeVariant(order.payment_status)}
                size="sm"
              >
                {paymentStatusLabel(order.payment_status)}
              </AdminBadge>
            </AdminTableCell>
            <AdminTableCell>
              <AdminBadge
                variant={fulfillmentBadgeVariant(order.fulfillment_status)}
                size="sm"
              >
                {fulfillmentStatusLabel(order.fulfillment_status)}
              </AdminBadge>
            </AdminTableCell>
            <AdminTableCell className="text-slate-600">
              {order.waybill_id ? (
                <span className="font-mono text-xs">{order.waybill_id}</span>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </AdminTableCell>
            <AdminTableCell>
              <AdminButton
                variant="ghost"
                size="sm"
                onClick={() => onView(order.order_id)}
              >
                View →
              </AdminButton>
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </AdminTableBody>
    </AdminTable>
  );
}
