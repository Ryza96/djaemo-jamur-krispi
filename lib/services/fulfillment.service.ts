import { OrderRepository } from "@/lib/repositories";
import { AuditLogService } from "./audit-log.service";
import { InventoryService } from "./inventory.service";
import { FULFILLMENT_STATUS, PAYMENT_STATUS } from "./payment/types";
import { getNotificationEngine } from "../notifications/engine-instance";
import type { FulfillmentStatus } from "./payment/types";
import type { NotificationEvent } from "../notifications/types";

const VALID_FULFILLMENT_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  [FULFILLMENT_STATUS.NEW]: [FULFILLMENT_STATUS.CONFIRMED, FULFILLMENT_STATUS.CANCELLED],
  [FULFILLMENT_STATUS.CONFIRMED]: [FULFILLMENT_STATUS.PACKING, FULFILLMENT_STATUS.CANCELLED],
  [FULFILLMENT_STATUS.PACKING]: [FULFILLMENT_STATUS.WAYBILL_CREATED, FULFILLMENT_STATUS.CANCELLED],
  [FULFILLMENT_STATUS.WAYBILL_CREATED]: [FULFILLMENT_STATUS.PICKED_UP],
  [FULFILLMENT_STATUS.PICKED_UP]: [FULFILLMENT_STATUS.SHIPPED],
  [FULFILLMENT_STATUS.SHIPPED]: [FULFILLMENT_STATUS.DELIVERED],
  [FULFILLMENT_STATUS.DELIVERED]: [],
  [FULFILLMENT_STATUS.CANCELLED]: [],
};

const FULFILLMENT_EVENT_MAP = {
  [FULFILLMENT_STATUS.CONFIRMED]: AuditLogService.events.ORDER_CONFIRMED,
  [FULFILLMENT_STATUS.PACKING]: AuditLogService.events.ORDER_PACKING,
  [FULFILLMENT_STATUS.WAYBILL_CREATED]: AuditLogService.events.ORDER_WAYBILL_CREATED,
  [FULFILLMENT_STATUS.PICKED_UP]: AuditLogService.events.ORDER_PICKED_UP,
  [FULFILLMENT_STATUS.SHIPPED]: AuditLogService.events.ORDER_SHIPPED,
  [FULFILLMENT_STATUS.DELIVERED]: AuditLogService.events.ORDER_COMPLETED,
  [FULFILLMENT_STATUS.CANCELLED]: AuditLogService.events.ORDER_CANCELLED,
} as const;

const CUSTOMER_NOTIFIABLE: Partial<Record<FulfillmentStatus, NotificationEvent>> = {
  [FULFILLMENT_STATUS.CONFIRMED]: AuditLogService.events.ORDER_CONFIRMED,
  [FULFILLMENT_STATUS.WAYBILL_CREATED]: AuditLogService.events.ORDER_WAYBILL_CREATED,
  [FULFILLMENT_STATUS.SHIPPED]: AuditLogService.events.ORDER_SHIPPED,
  [FULFILLMENT_STATUS.DELIVERED]: AuditLogService.events.ORDER_COMPLETED,
  [FULFILLMENT_STATUS.CANCELLED]: AuditLogService.events.ORDER_CANCELLED,
};

export interface FulfillmentActionResult {
  success: boolean;
  orderId: string;
  previousStatus: FulfillmentStatus | null;
  newStatus: FulfillmentStatus;
  message: string;
}

const LEGACY_FULFILLMENT_MAP: Record<string, FulfillmentStatus> = {
  processing: FULFILLMENT_STATUS.CONFIRMED,
  completed: FULFILLMENT_STATUS.DELIVERED,
};

function normalizeFulfillmentStatus(raw: string | null | undefined): FulfillmentStatus | null {
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  const validValues = Object.values(FULFILLMENT_STATUS) as string[];
  if (validValues.includes(normalized)) {
    return normalized as FulfillmentStatus;
  }
  const legacy = LEGACY_FULFILLMENT_MAP[normalized];
  if (legacy) return legacy;
  return null;
}

export const FulfillmentService = {
  async process(orderId: string): Promise<FulfillmentActionResult> {
    return executeTransition(orderId, FULFILLMENT_STATUS.CONFIRMED);
  },

  async pack(orderId: string): Promise<FulfillmentActionResult> {
    return executeTransition(orderId, FULFILLMENT_STATUS.PACKING);
  },

  async createWaybill(orderId: string): Promise<FulfillmentActionResult> {
    return executeTransition(orderId, FULFILLMENT_STATUS.WAYBILL_CREATED);
  },

  async markAsPickedUp(orderId: string): Promise<FulfillmentActionResult> {
    return executeTransition(orderId, FULFILLMENT_STATUS.PICKED_UP);
  },

  async ship(orderId: string, waybillId?: string): Promise<FulfillmentActionResult> {
    return executeTransition(
      orderId,
      FULFILLMENT_STATUS.SHIPPED,
      waybillId ? { waybill_id: waybillId } : undefined,
    );
  },

  async complete(orderId: string): Promise<FulfillmentActionResult> {
    return executeTransition(orderId, FULFILLMENT_STATUS.DELIVERED);
  },

  async cancel(orderId: string, reason?: string): Promise<FulfillmentActionResult> {
    return executeTransition(
      orderId,
      FULFILLMENT_STATUS.CANCELLED,
      reason ? { cancellation_reason: reason } : undefined,
    );
  },

  isValidTransition(from: FulfillmentStatus | null, to: FulfillmentStatus): boolean {
    if (!from) {
      return to === FULFILLMENT_STATUS.CONFIRMED || to === FULFILLMENT_STATUS.CANCELLED;
    }
    const allowed = VALID_FULFILLMENT_TRANSITIONS[from];
    if (!allowed) return false;
    return allowed.includes(to);
  },
};

async function executeTransition(
  orderId: string,
  targetStatus: FulfillmentStatus,
  extra?: { waybill_id?: string; cancellation_reason?: string },
): Promise<FulfillmentActionResult> {
  const order = await OrderRepository.findByOrderId(orderId);
  if (!order) {
    return {
      success: false,
      orderId,
      previousStatus: null,
      newStatus: targetStatus,
      message: "ORDER_NOT_FOUND",
    };
  }

  const currentFulfillmentStatus = normalizeFulfillmentStatus(order.fulfillment_status);

  if (!currentFulfillmentStatus) {
    return {
      success: false,
      orderId,
      previousStatus: null,
      newStatus: targetStatus,
      message: `Invalid current fulfillment status: ${order.fulfillment_status}`,
    };
  }

  if (!FulfillmentService.isValidTransition(currentFulfillmentStatus, targetStatus)) {
    return {
      success: false,
      orderId,
      previousStatus: currentFulfillmentStatus,
      newStatus: targetStatus,
      message: `Invalid transition: ${currentFulfillmentStatus} → ${targetStatus}`,
    };
  }

  if (targetStatus === FULFILLMENT_STATUS.SHIPPED) {
    const paymentStatus = (order.payment_status ?? order.status ?? "").toLowerCase();
    if (paymentStatus !== PAYMENT_STATUS.PAID) {
      return {
        success: false,
        orderId,
        previousStatus: currentFulfillmentStatus,
        newStatus: targetStatus,
        message: `Cannot ship: payment is not paid (current: ${paymentStatus})`,
      };
    }
  }

  if (targetStatus === FULFILLMENT_STATUS.CONFIRMED) {
    const result = await InventoryService.deductOrderStock(orderId);
    if (!result.success) {
      return {
        success: false,
        orderId,
        previousStatus: currentFulfillmentStatus,
        newStatus: targetStatus,
        message: result.message ?? "INVENTORY_DEDUCT_FAILED",
      };
    }
  }

  if (targetStatus === FULFILLMENT_STATUS.CANCELLED) {
    const result = await InventoryService.restoreOrderStock(orderId);
    if (result.message === "PARTIAL_RESTORE_FAILURE") {
      await AuditLogService.logFulfillmentEvent({
        orderId,
        event: AuditLogService.events.ROLLBACK,
        fromStatus: currentFulfillmentStatus,
        toStatus: targetStatus,
        metadata: {
          partialRestoreFailure: true,
          items: result.items,
        },
      });
    }
  }

  await OrderRepository.updateFulfillmentStatus(
    order.id,
    targetStatus,
    extra,
  );

  const auditEvent = FULFILLMENT_EVENT_MAP[targetStatus as keyof typeof FULFILLMENT_EVENT_MAP] ?? AuditLogService.events.STATUS_CHANGED;
  await AuditLogService.logFulfillmentEvent({
    orderId,
    event: auditEvent,
    fromStatus: currentFulfillmentStatus,
    toStatus: targetStatus,
    metadata: extra ?? undefined,
  });

  const notificationEvent = CUSTOMER_NOTIFIABLE[targetStatus];
  if (notificationEvent) {
    getNotificationEngine().notify(notificationEvent, orderId);
  }

  return {
    success: true,
    orderId,
    previousStatus: currentFulfillmentStatus,
    newStatus: targetStatus,
    message: `Order ${orderId} updated from ${currentFulfillmentStatus} to ${targetStatus}`,
  };
}
