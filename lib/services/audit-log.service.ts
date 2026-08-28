import { AuditLogRepository } from "@/lib/repositories/audit-log.repository";
import type { PaymentStatus, FulfillmentStatus } from "./payment/types";

const AUDIT_EVENTS = {
  ORDER_CREATED: "order.created",
  SNAP_CREATED: "snap.created",
  SNAP_RETRY: "snap.retry",
  CALLBACK_RECEIVED: "callback.received",
  STATUS_CHANGED: "status.changed",
  CALLBACK_SKIPPED: "callback.skipped",
  CALLBACK_INVALID: "callback.invalid",
  ROLLBACK: "order.rollback",
  ORDER_RECOVERED: "order.recovered",
  ORDER_CONFIRMED: "order.confirmed",
  ORDER_PACKING: "order.packing",
  ORDER_WAYBILL_CREATED: "order.waybill_created",
  ORDER_PICKED_UP: "order.picked_up",
  ORDER_SHIPPED: "order.shipped",
  ORDER_COMPLETED: "order.completed",
  ORDER_CANCELLED: "order.cancelled",
  ORDER_WAITING_FOR_RESTOCK: "order.waiting_for_restock",
  PAYMENT_MANUAL_CONFIRM: "payment.manual_confirm",
  REFUND_CONFIRMED: "payment.refund_confirmed",
  NOTES_UPDATED: "order.notes_updated",
  VOUCHER_USAGE_RELEASED_ON_RECOVERY: "voucher.usage_released_on_recovery",

  // Shipping events
  SHIPMENT_CREATED: "shipment.created",
  SHIPMENT_PICKING_UP: "shipment.picking_up",
  SHIPMENT_DROPPING_OFF: "shipment.dropping_off",
  SHIPMENT_IN_TRANSIT: "shipment.in_transit",
  SHIPMENT_DELIVERED: "shipment.delivered",
  SHIPMENT_CANCELLED: "shipment.cancelled",
  SHIPMENT_RETRY: "shipment.retry",
} as const;

export type AuditEvent = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS];

export const AuditLogService = {
  async logPaymentEvent(params: {
    orderId: string;
    event: AuditEvent;
    fromStatus: PaymentStatus | string | null;
    toStatus: PaymentStatus | string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await AuditLogRepository.insert({
      orderId: params.orderId,
      event: params.event,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      metadata: params.metadata,
    });
  },

  async logFulfillmentEvent(params: {
    orderId: string;
    event: AuditEvent;
    fromStatus: FulfillmentStatus | string | null;
    toStatus: FulfillmentStatus | string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await AuditLogRepository.insert({
      orderId: params.orderId,
      event: params.event,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      metadata: params.metadata,
    });
  },

  events: AUDIT_EVENTS,
};
