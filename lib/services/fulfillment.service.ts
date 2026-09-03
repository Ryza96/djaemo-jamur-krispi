import { OrderRepository, VoucherRepository } from "@/lib/repositories";
import { after } from "next/server";
import { AuditLogService } from "./audit-log.service";
import { InventoryService } from "./inventory.service";
import { FULFILLMENT_STATUS, PAYMENT_STATUS } from "./payment/types";
import { getNotificationEngine } from "../notifications/engine-instance";
import type { FulfillmentStatus } from "./payment/types";
import type { NotificationEvent } from "../notifications/types";

const VALID_FULFILLMENT_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  [FULFILLMENT_STATUS.NEW]: [FULFILLMENT_STATUS.CONFIRMED, FULFILLMENT_STATUS.CANCELLED, FULFILLMENT_STATUS.WAITING_FOR_RESTOCK],
  [FULFILLMENT_STATUS.CONFIRMED]: [FULFILLMENT_STATUS.PACKING, FULFILLMENT_STATUS.CANCELLED],
  [FULFILLMENT_STATUS.PACKING]: [FULFILLMENT_STATUS.WAYBILL_CREATED, FULFILLMENT_STATUS.CANCELLED],
  [FULFILLMENT_STATUS.WAYBILL_CREATED]: [FULFILLMENT_STATUS.PICKED_UP, FULFILLMENT_STATUS.SHIPPED],
  [FULFILLMENT_STATUS.PICKED_UP]: [FULFILLMENT_STATUS.SHIPPED],
  [FULFILLMENT_STATUS.SHIPPED]: [FULFILLMENT_STATUS.DELIVERED],
  [FULFILLMENT_STATUS.DELIVERED]: [],
  [FULFILLMENT_STATUS.CANCELLED]: [],
  [FULFILLMENT_STATUS.WAITING_FOR_RESTOCK]: [FULFILLMENT_STATUS.CONFIRMED, FULFILLMENT_STATUS.CANCELLED],
};

const FULFILLMENT_EVENT_MAP = {
  [FULFILLMENT_STATUS.CONFIRMED]: AuditLogService.events.ORDER_CONFIRMED,
  [FULFILLMENT_STATUS.PACKING]: AuditLogService.events.ORDER_PACKING,
  [FULFILLMENT_STATUS.WAYBILL_CREATED]: AuditLogService.events.ORDER_WAYBILL_CREATED,
  [FULFILLMENT_STATUS.PICKED_UP]: AuditLogService.events.ORDER_PICKED_UP,
  [FULFILLMENT_STATUS.SHIPPED]: AuditLogService.events.ORDER_SHIPPED,
  [FULFILLMENT_STATUS.DELIVERED]: AuditLogService.events.ORDER_COMPLETED,
  [FULFILLMENT_STATUS.CANCELLED]: AuditLogService.events.ORDER_CANCELLED,
  [FULFILLMENT_STATUS.WAITING_FOR_RESTOCK]: AuditLogService.events.ORDER_WAITING_FOR_RESTOCK,
} as const;

const CUSTOMER_NOTIFIABLE: Partial<Record<FulfillmentStatus, NotificationEvent>> = {
  [FULFILLMENT_STATUS.CONFIRMED]: AuditLogService.events.ORDER_CONFIRMED,
};

const STOCK_DEDUCTED_STATUSES = new Set<FulfillmentStatus>([
  FULFILLMENT_STATUS.CONFIRMED,
  FULFILLMENT_STATUS.PACKING,
  FULFILLMENT_STATUS.WAYBILL_CREATED,
  FULFILLMENT_STATUS.PICKED_UP,
]);

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
    const order = await OrderRepository.findByOrderId(orderId);
    if (!order) {
      return {
        success: false,
        orderId,
        previousStatus: null,
        newStatus: FULFILLMENT_STATUS.CONFIRMED,
        message: "ORDER_NOT_FOUND",
      };
    }

    const paymentStatus = (order.payment_status ?? order.status ?? "").toLowerCase();
    if (paymentStatus !== PAYMENT_STATUS.PAID) {
      return {
        success: false,
        orderId,
        previousStatus: normalizeFulfillmentStatus(order.fulfillment_status),
        newStatus: FULFILLMENT_STATUS.CONFIRMED,
        message: `Cannot process: payment is not paid (current: ${paymentStatus})`,
      };
    }

    const deductResult = await InventoryService.deductOrderStock(orderId);
    const targetStatus = deductResult.success
      ? FULFILLMENT_STATUS.CONFIRMED
      : FULFILLMENT_STATUS.WAITING_FOR_RESTOCK;

    return executeTransition(
      orderId,
      targetStatus,
      !deductResult.success ? { stockShortage: true } : undefined,
      true,
    );
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
  extra?: Record<string, unknown>,
  skipInventoryCheck?: boolean,
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
    const waybillId = (
      (((extra?.waybill_id as string | undefined) ?? order.waybill_id) ?? "").toString().trim()
    );
    if (!waybillId) {
      return {
        success: false,
        orderId,
        previousStatus: currentFulfillmentStatus,
        newStatus: targetStatus,
        message: "WAYBILL_REQUIRED",
      };
    }
    extra = { ...(extra ?? {}), waybill_id: waybillId };
  }

  if (targetStatus !== FULFILLMENT_STATUS.CANCELLED) {
    const paymentStatus = (order.payment_status ?? order.status ?? "").toLowerCase();
    if (paymentStatus !== PAYMENT_STATUS.PAID) {
      return {
        success: false,
        orderId,
        previousStatus: currentFulfillmentStatus,
        newStatus: targetStatus,
        message: `Cannot transition: payment is not paid (current: ${paymentStatus})`,
      };
    }
  }

  if (targetStatus === FULFILLMENT_STATUS.CONFIRMED && !skipInventoryCheck) {
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

  if (
    targetStatus === FULFILLMENT_STATUS.CANCELLED &&
    STOCK_DEDUCTED_STATUSES.has(currentFulfillmentStatus)
  ) {
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

  // Return any reserved voucher usage when an order is cancelled BEFORE it
  // completes. Usage is reserved at draft-creation time (apply_voucher), and
  // unlike inventory it is NOT tied to a stock-deducted status, so it is
  // released for any cancelled order that used a voucher. The
  // release_voucher_usage RPC is atomic + idempotent and handles the
  // race between a webhook expire and an admin cancel (slot returned at
  // most once per order).
  //
  // KNOWN LIMITATION (accepted business decision, NOT a bug): if this order
  // is later RECOVERED to a success/completed state after a late payment,
  // the released quota is NOT re-applied, so the voucher can overshoot by at
  // most 1 slot per such event. Re-applying on recovery is intentionally not
  // done here; the edge case is only surfaced via the
  // VOUCHER_USAGE_RELEASED_ON_RECOVERY audit event at the recovery site.
  if (targetStatus === FULFILLMENT_STATUS.CANCELLED && order.voucher_code) {
    try {
      await VoucherRepository.releaseUsage(order.id);
    } catch (err) {
      await AuditLogService.logFulfillmentEvent({
        orderId,
        event: AuditLogService.events.ROLLBACK,
        fromStatus: currentFulfillmentStatus,
        toStatus: targetStatus,
        metadata: {
          reason: "voucher_release_failed",
          detail: err instanceof Error ? err.message : "RELEASE_FAILED",
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

  // Cancelling an already-paid order creates a manual refund obligation:
  // record it in the audit metadata so the admin UI can surface a persistent
  // reminder until the refund is confirmed.
  let auditMetadata = extra ?? undefined;
  if (targetStatus === FULFILLMENT_STATUS.CANCELLED) {
    const paymentStatus = (order.payment_status ?? order.status ?? "").toLowerCase();
    if (paymentStatus === PAYMENT_STATUS.PAID) {
      auditMetadata = {
        ...(auditMetadata ?? {}),
        refund_required: true,
        amount: order.total_amount,
        refunded: false,
      };
    }
  }

  await AuditLogService.logFulfillmentEvent({
    orderId,
    event: auditEvent,
    fromStatus: currentFulfillmentStatus,
    toStatus: targetStatus,
    metadata: auditMetadata,
  });

  const notificationEvent = CUSTOMER_NOTIFIABLE[targetStatus];
  if (notificationEvent) {
    // `notify` itself is fire-and-forget (returns void, swallows the underlying
    // promise), so to guarantee the dispatch completes before the serverless
    // instance is frozen after the response, schedule the real `dispatch`
    // promise via `after()` — `after` keeps the instance alive until the
    // returned promise settles. Fires only from the admin order-action route
    // (request scope), so `after()` is valid here.
    after(() =>
      getNotificationEngine().dispatch(notificationEvent, orderId).catch(() => {}),
    );
  }

  return {
    success: true,
    orderId,
    previousStatus: currentFulfillmentStatus,
    newStatus: targetStatus,
    message: `Order ${orderId} updated from ${currentFulfillmentStatus} to ${targetStatus}`,
  };
}
