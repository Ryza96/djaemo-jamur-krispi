import { OrderRepository, CustomerRepository } from "@/lib/repositories";
import { AuditLogRepository } from "@/lib/repositories/audit-log.repository";
import { combineAddress, mapMidtransStatus } from "./payment/mapper";
import { verifyMidtransSignature } from "./payment/verifySignature";
import { isTransactionSettledAtMidtrans } from "./payment/midtrans-verify";
import { AuditLogService } from "./audit-log.service";
import { FulfillmentService } from "./fulfillment.service";
import { PAYMENT_STATUS, FULFILLMENT_STATUS } from "./payment/types";

import type {
  PaymentStatus,
  FulfillmentStatus,
  MidtransNotification,
  CreatePaymentRequest,
  RefundInfo,
} from "./payment/types";

export interface CreateOrderResult {
  id: string;
  orderId: string;
  accessToken: string;
}

export interface ProcessCallbackResult {
  success: boolean;
  orderId: string;
  paymentStatus: PaymentStatus;
  message: string;
}

export const OrderService = {
  async createDraft(
    params: CreatePaymentRequest,
    initialFulfillmentStatus: FulfillmentStatus = FULFILLMENT_STATUS.NEW,
  ): Promise<CreateOrderResult> {
    const existing = await OrderRepository.findByOrderId(params.orderId);
    if (existing) {
      throw new Error("ORDER_ID_EXISTS");
    }

    const fullAddress = combineAddress(params.shippingAddress);
    const totalAmount = params.subtotal + params.shippingFee;

    const customer = await CustomerRepository.upsert({
      email: params.customerInfo.email,
      name: params.customerInfo.name,
      phone: params.customerInfo.whatsapp,
      address: fullAddress,
    });

    const order = await OrderRepository.insert({
      order_id: params.orderId,
      customer_id: customer.id,
      customer_name: params.customerInfo.name,
      customer_phone: params.customerInfo.whatsapp,
      customer_email: params.customerInfo.email,
      subtotal: params.subtotal,
      shipping_fee: params.shippingFee,
      total_amount: totalAmount,
      destination: params.shippingAddress.city,
      shipping_service: `${params.shippingCourier} ${params.shippingService}`,
      courier_company: params.shippingCourier,
      courier_type: params.shippingService,
      shipping_cost: params.shippingFee,
      shipping_address: fullAddress,
      postal_code: params.shippingAddress.postalCode,
      notes: params.customerInfo.notes || null,
      payment_status: PAYMENT_STATUS.UNPAID,
      fulfillment_status: initialFulfillmentStatus,
      destination_area_id: params.shippingAddress.areaId ?? null,
    });

    const orderItems = params.items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    try {
      await OrderRepository.insertItems(orderItems);
    } catch {
      try {
        await OrderRepository.deleteById(order.id);
      } catch {
        // rollback failure is non-blocking; original error is preserved
      }
      throw new Error("ORDER_ITEMS_FAILED");
    }

    await AuditLogService.logPaymentEvent({
      orderId: params.orderId,
      event: AuditLogService.events.ORDER_CREATED,
      fromStatus: null,
      toStatus: PAYMENT_STATUS.UNPAID,
    });

    return { id: order.id, orderId: params.orderId, accessToken: order.access_token };
  },

  async confirmPayment(
    orderId: string,
    token: string,
  ): Promise<void> {
    const order = await OrderRepository.findByOrderId(orderId);
    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    await OrderRepository.updatePayment(order.id, {
      payment_status: PAYMENT_STATUS.PENDING,
      transaction_id: token,
    });

    await AuditLogService.logPaymentEvent({
      orderId,
      event: AuditLogService.events.SNAP_CREATED,
      fromStatus: PAYMENT_STATUS.UNPAID,
      toStatus: PAYMENT_STATUS.PENDING,
      metadata: { token },
    });
  },

  async expireUnpaidOrder(
    orderId: string,
    reason: string = "payment_expired",
  ): Promise<{ success: boolean; message: string }> {
    let order = await OrderRepository.findByOrderId(orderId);
    if (!order) {
      return { success: false, message: "ORDER_NOT_FOUND" };
    }

    const readStatus = (
      source: { payment_status: string | null; status: string | null },
    ): PaymentStatus =>
      (source.payment_status ?? source.status ?? "").toLowerCase() as PaymentStatus;

    let currentStatus = readStatus(order);

    if (currentStatus === PAYMENT_STATUS.PAID) {
      return { success: false, message: "ORDER_ALREADY_PAID" };
    }

    if (
      currentStatus !== PAYMENT_STATUS.PENDING &&
      currentStatus !== PAYMENT_STATUS.UNPAID
    ) {
      return {
        success: false,
        message: `ORDER_NOT_EXPIRABLE (current: ${currentStatus})`,
      };
    }

    // Conditional update guarded by the status we just read. If another
    // process (e.g. a Midtrans webhook marking the order PAID) changed the
    // status between our read and write, the update matches 0 rows and we
    // must NOT proceed to cancel the fulfillment.
    let targetStatus =
      currentStatus === PAYMENT_STATUS.PENDING
        ? PAYMENT_STATUS.EXPIRED
        : PAYMENT_STATUS.FAILED;

    let updatedRows = await OrderRepository.updatePaymentByOrderIdIf(
      orderId,
      { payment_status: targetStatus },
      [currentStatus],
    );

    if (updatedRows === 0) {
      // Stale read or lost race — re-read once and retry with fresh state.
      order = await OrderRepository.findByOrderId(orderId);
      if (!order) {
        return { success: false, message: "ORDER_NOT_FOUND" };
      }
      currentStatus = readStatus(order);

      if (currentStatus === PAYMENT_STATUS.PAID) {
        return { success: false, message: "ORDER_ALREADY_PAID" };
      }
      if (
        currentStatus !== PAYMENT_STATUS.PENDING &&
        currentStatus !== PAYMENT_STATUS.UNPAID
      ) {
        return {
          success: false,
          message: `ORDER_NOT_EXPIRABLE (current: ${currentStatus})`,
        };
      }

      targetStatus =
        currentStatus === PAYMENT_STATUS.PENDING
          ? PAYMENT_STATUS.EXPIRED
          : PAYMENT_STATUS.FAILED;

      updatedRows = await OrderRepository.updatePaymentByOrderIdIf(
        orderId,
        { payment_status: targetStatus },
        [currentStatus],
      );

      if (updatedRows === 0) {
        const latest = await OrderRepository.findByOrderId(orderId);
        return {
          success: false,
          message: `ORDER_CONCURRENT_MODIFICATION (current: ${
            latest?.payment_status ?? "unknown"
          })`,
        };
      }
    }

    const cancelResult = await FulfillmentService.cancel(orderId, reason);
    if (!cancelResult.success) {
      await AuditLogService.logPaymentEvent({
        orderId,
        event: AuditLogService.events.ROLLBACK,
        fromStatus: targetStatus as PaymentStatus,
        toStatus: targetStatus as PaymentStatus,
        metadata: { reason: "auto_cancel_failed", detail: cancelResult.message },
      });
    }

    await AuditLogService.logPaymentEvent({
      orderId,
      event: AuditLogService.events.STATUS_CHANGED,
      fromStatus: currentStatus as PaymentStatus,
      toStatus: targetStatus as PaymentStatus,
      metadata: { reason },
    });

    return {
      success: true,
      message: `Order ${orderId} marked as ${targetStatus}`,
    };
  },

  /**
   * Recovers an order whose payment was marked EXPIRED/FAILED by a local
   * race (auto-expire) — or whose fulfillment was cancelled by an admin
   * while the order was still UNPAID/PENDING — but for which Midtrans has
   * actually captured the funds. Restores the order to PAID, un-cancels
   * fulfillment back to NEW, and records audit entries so the recovery is
   * traceable.
   *
   * Callers MUST verify settlement with Midtrans Core API first.
   */
  async recoverPaidOrderFromTerminal(
    orderId: string,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    // Conditional write from pre-paid states only; if another process
    // already recovered it to PAID this matches 0 rows and we treat it as
    // an idempotent success.
    const updatedRows = await OrderRepository.updatePaymentByOrderIdIf(
      orderId,
      { payment_status: PAYMENT_STATUS.PAID },
      [
        PAYMENT_STATUS.EXPIRED,
        PAYMENT_STATUS.FAILED,
        PAYMENT_STATUS.UNPAID,
        PAYMENT_STATUS.PENDING,
      ],
    );

    if (updatedRows === 0) {
      const latest = await OrderRepository.findByOrderId(orderId);
      if (!latest) {
        return { success: false, message: "ORDER_NOT_FOUND" };
      }
      const latestStatus = (
        latest.payment_status ?? ""
      ).toLowerCase();
      if (latestStatus === PAYMENT_STATUS.PAID) {
        return { success: true, message: "ORDER_ALREADY_PAID" };
      }
      return {
        success: false,
        message: `ORDER_NOT_RECOVERABLE (current: ${latestStatus})`,
      };
    }

    await AuditLogService.logPaymentEvent({
      orderId,
      event: AuditLogService.events.ORDER_RECOVERED,
      fromStatus: "expired_or_failed",
      toStatus: PAYMENT_STATUS.PAID,
      metadata: { reason, recovery: "midtrans_race_recovery" },
    });

    await AuditLogService.logPaymentEvent({
      orderId,
      event: AuditLogService.events.STATUS_CHANGED,
      fromStatus: "expired_or_failed",
      toStatus: PAYMENT_STATUS.PAID,
      metadata: { reason, recovery: "midtrans_race_recovery" },
    });

    // Un-cancel fulfillment. Stock semantics stay consistent: cancel only
    // restored stock when it had previously been deducted (admin-confirmed
    // statuses), so resetting CANCELLED -> NEW leaves the order in a clean
    // pre-confirmation state that admin can confirm again.
    const order = await OrderRepository.findByOrderId(orderId);
    if (
      order &&
      (order.fulfillment_status ?? "").toLowerCase() ===
        FULFILLMENT_STATUS.CANCELLED
    ) {
      await OrderRepository.updateFulfillmentStatus(
        order.id,
        FULFILLMENT_STATUS.NEW,
      );
      await OrderRepository.clearCancellation(order.id);

      await AuditLogService.logFulfillmentEvent({
        orderId,
        event: AuditLogService.events.STATUS_CHANGED,
        fromStatus: FULFILLMENT_STATUS.CANCELLED,
        toStatus: FULFILLMENT_STATUS.NEW,
        metadata: { reason, recovery: "midtrans_race_recovery" },
      });
    }

    return { success: true, message: `Order ${orderId} recovered to PAID` };
  },

  async processCallback(
    notification: MidtransNotification,
  ): Promise<ProcessCallbackResult> {
    const { order_id, status_code, gross_amount, signature_key } = notification;

    const isValid = verifyMidtransSignature({
      orderId: order_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      signatureKey: signature_key,
    });

    if (!isValid) {
      await AuditLogService.logPaymentEvent({
        orderId: order_id,
        event: AuditLogService.events.CALLBACK_INVALID,
        fromStatus: null,
        toStatus: PAYMENT_STATUS.FAILED,
        metadata: { reason: "invalid_signature" },
      });

      return {
        success: false,
        orderId: order_id,
        paymentStatus: PAYMENT_STATUS.FAILED,
        message: "Invalid signature",
      };
    }

    const order = await OrderRepository.findByOrderId(order_id);
    if (!order) {
      return {
        success: false,
        orderId: order_id,
        paymentStatus: PAYMENT_STATUS.FAILED,
        message: "Order not found",
      };
    }

    const currentStatus = (order.payment_status ?? order.status) as PaymentStatus;

    const expectedGrossAmount = order.total_amount;
    const notifiedAmount = Math.round(Number(gross_amount));

    if (notifiedAmount !== expectedGrossAmount) {
      await AuditLogService.logPaymentEvent({
        orderId: order_id,
        event: AuditLogService.events.CALLBACK_INVALID,
        fromStatus: currentStatus,
        toStatus: currentStatus,
        metadata: {
          reason: "gross_amount_mismatch",
          expected: expectedGrossAmount,
          received: notifiedAmount,
        },
      });

      return {
        success: false,
        orderId: order_id,
        paymentStatus: currentStatus,
        message: "Gross amount mismatch",
      };
    }

    if (currentStatus === PAYMENT_STATUS.PAID) {
      await AuditLogService.logPaymentEvent({
        orderId: order_id,
        event: AuditLogService.events.CALLBACK_SKIPPED,
        fromStatus: currentStatus,
        toStatus: currentStatus,
        metadata: { reason: "already_paid" },
      });

      return {
        success: true,
        orderId: order_id,
        paymentStatus: PAYMENT_STATUS.PAID,
        message: "Order already paid, skipping duplicate callback",
      };
    }

    const newStatus = mapMidtransStatus(notification.transaction_status);

    // UNPAID -> PAID is allowed: a Midtrans settlement is a fact that must
    // always be processable even if our DB never reached PENDING (e.g. the
    // confirm step failed after Snap creation). Already-PAID orders are
    // skipped above as an idempotent no-op. Exception: when the fulfillment
    // was already cancelled, settlement is diverted to the verified
    // recovery path below instead of this plain write.
    const validTransitions: Record<string, PaymentStatus[]> = {
      [PAYMENT_STATUS.UNPAID]: [
        PAYMENT_STATUS.PENDING,
        PAYMENT_STATUS.PAID,
      ],
      [PAYMENT_STATUS.PENDING]: [
        PAYMENT_STATUS.PAID,
        PAYMENT_STATUS.FAILED,
        PAYMENT_STATUS.EXPIRED,
      ],
      [PAYMENT_STATUS.PAID]: [],
      [PAYMENT_STATUS.FAILED]: [],
      [PAYMENT_STATUS.EXPIRED]: [],
    };

    const allowed = validTransitions[currentStatus];

    // A settlement arriving for an order whose fulfillment was already
    // cancelled (manual admin cancel while UNPAID/PENDING) must NOT go
    // through the plain status write: that would produce a paid-but-dead
    // order. Route it through the verified recovery path instead so the
    // fulfillment is un-cancelled and the money is never stranded.
    const paidIntoCancelledFulfillment =
      newStatus === PAYMENT_STATUS.PAID &&
      (currentStatus === PAYMENT_STATUS.UNPAID ||
        currentStatus === PAYMENT_STATUS.PENDING) &&
      (order.fulfillment_status ?? "").toLowerCase() ===
        FULFILLMENT_STATUS.CANCELLED;

    if (!allowed?.includes(newStatus) || paidIntoCancelledFulfillment) {
      const isRaceRecoveryCandidate =
        newStatus === PAYMENT_STATUS.PAID &&
        (currentStatus === PAYMENT_STATUS.EXPIRED ||
          currentStatus === PAYMENT_STATUS.FAILED ||
          ((currentStatus === PAYMENT_STATUS.UNPAID ||
            currentStatus === PAYMENT_STATUS.PENDING) &&
            (order.fulfillment_status ?? "").toLowerCase() ===
              FULFILLMENT_STATUS.CANCELLED));

      if (!isRaceRecoveryCandidate) {
        await AuditLogService.logPaymentEvent({
          orderId: order_id,
          event: AuditLogService.events.CALLBACK_INVALID,
          fromStatus: currentStatus,
          toStatus: newStatus,
          metadata: { reason: "invalid_transition" },
        });

        return {
          success: false,
          orderId: order_id,
          paymentStatus: currentStatus,
          message: `Invalid status transition: ${currentStatus} → ${newStatus}`,
        };
      }

      // Race condition recovery: our DB marked the order EXPIRED/FAILED
      // while the customer was actually completing payment, OR an admin
      // cancelled the still-unpaid order before the customer finished
      // paying. Money must not be lost to a local state race — verify with
      // Midtrans Core API that the transaction is genuinely settled right
      // now, then recover.
      const settledOnMidtrans = await isTransactionSettledAtMidtrans(order_id);

      if (!settledOnMidtrans) {
        await AuditLogService.logPaymentEvent({
          orderId: order_id,
          event: AuditLogService.events.CALLBACK_INVALID,
          fromStatus: currentStatus,
          toStatus: newStatus,
          metadata: { reason: "recovery_rejected_midtrans_mismatch" },
        });

        return {
          success: false,
          orderId: order_id,
          paymentStatus: currentStatus,
          message:
            "Recovery rejected: Midtrans does not confirm settlement for this order",
        };
      }

      const recovery = await OrderService.recoverPaidOrderFromTerminal(
        order_id,
        currentStatus === PAYMENT_STATUS.EXPIRED ||
          currentStatus === PAYMENT_STATUS.FAILED
          ? "webhook_race_recovery"
          : "webhook_paid_after_manual_cancel",
      );

      if (!recovery.success) {
        await AuditLogService.logPaymentEvent({
          orderId: order_id,
          event: AuditLogService.events.CALLBACK_INVALID,
          fromStatus: currentStatus,
          toStatus: newStatus,
          metadata: { reason: "recovery_failed", detail: recovery.message },
        });

        return {
          success: false,
          orderId: order_id,
          paymentStatus: currentStatus,
          message: `Recovery failed: ${recovery.message}`,
        };
      }

      return {
        success: true,
        orderId: order_id,
        paymentStatus: PAYMENT_STATUS.PAID,
        message:
          "Order recovered after race condition: Midtrans confirmed settlement",
      };
    }

    // Conditional write guarded by the status we validated against. If a
    // concurrent process changed the status in between, we lose exactly 0
    // rows and re-check instead of overwriting.
    const updatedRows = await OrderRepository.updatePaymentByOrderIdIf(
      order_id,
      {
        payment_status: newStatus,
        transaction_id: notification.transaction_id || order.transaction_id!,
        payment_method: notification.payment_type || null,
      },
      [currentStatus],
    );

    if (updatedRows === 0) {
      const latest = await OrderRepository.findByOrderId(order_id);
      const latestStatus = (
        latest?.payment_status ?? ""
      ).toLowerCase() as PaymentStatus;

      if (latestStatus === PAYMENT_STATUS.PAID) {
        await AuditLogService.logPaymentEvent({
          orderId: order_id,
          event: AuditLogService.events.CALLBACK_SKIPPED,
          fromStatus: latestStatus,
          toStatus: latestStatus,
          metadata: { reason: "already_paid_by_concurrent_update" },
        });

        return {
          success: true,
          orderId: order_id,
          paymentStatus: PAYMENT_STATUS.PAID,
          message: "Order already paid by concurrent update, skipping",
        };
      }

      await AuditLogService.logPaymentEvent({
        orderId: order_id,
        event: AuditLogService.events.CALLBACK_INVALID,
        fromStatus: latestStatus,
        toStatus: newStatus,
        metadata: { reason: "concurrent_modification" },
      });

      return {
        success: false,
        orderId: order_id,
        paymentStatus: latestStatus,
        message: "Concurrent modification detected, retry later",
      };
    }

    if (newStatus === PAYMENT_STATUS.FAILED || newStatus === PAYMENT_STATUS.EXPIRED) {
      const cancelResult = await FulfillmentService.cancel(
        order_id,
        newStatus === PAYMENT_STATUS.FAILED ? "payment_failed" : "payment_expired",
      );
      if (!cancelResult.success) {
        await AuditLogService.logPaymentEvent({
          orderId: order_id,
          event: AuditLogService.events.ROLLBACK,
          fromStatus: newStatus,
          toStatus: newStatus,
          metadata: {
            reason: "auto_cancel_failed",
            detail: cancelResult.message,
          },
        });
      }
    }

    await AuditLogService.logPaymentEvent({
      orderId: order_id,
      event: AuditLogService.events.STATUS_CHANGED,
      fromStatus: currentStatus,
      toStatus: newStatus,
      metadata: {
        transaction_id: notification.transaction_id,
        payment_type: notification.payment_type,
        fraud_status: notification.fraud_status,
      },
    });

    return {
      success: true,
      orderId: order_id,
      paymentStatus: newStatus,
      message: `Order status updated to ${newStatus}`,
    };
  },

  /**
   * Derives manual-refund tracking state from the append-only audit log.
   * An ORDER_CANCELLED entry carrying metadata.refund_required=true marks
   * the start of an obligation; any later REFUND_CONFIRMED entry closes it
   * (admin confirmed the manual Midtrans Dashboard refund).
   */
  async getRefundInfo(orderId: string): Promise<RefundInfo | null> {
    const logs = await AuditLogRepository.findByOrderId(orderId);

    let cancelIndex = -1;
    let amount: number | null = null;
    logs.forEach((log, index) => {
      if (
        log.event === AuditLogService.events.ORDER_CANCELLED &&
        log.metadata?.refund_required === true
      ) {
        cancelIndex = index;
        amount =
          typeof log.metadata.amount === "number" ? log.metadata.amount : null;
      }
    });

    if (cancelIndex === -1) return null;

    const refunded = logs
      .slice(cancelIndex + 1)
      .some((log) => log.event === AuditLogService.events.REFUND_CONFIRMED);

    return { required: true, refunded, amount };
  },

  /**
   * Records that an admin completed the manual refund (Midtrans Dashboard)
   * for a previously cancelled paid order. Appends a new audit entry rather
   * than mutating history, keeping the log append-only.
   */
  async confirmManualRefund(
    orderId: string,
  ): Promise<{
    success: boolean;
    message: string;
    refundInfo: RefundInfo | null;
  }> {
    const order = await OrderRepository.findByOrderId(orderId);
    if (!order) {
      return {
        success: false,
        message: "ORDER_NOT_FOUND",
        refundInfo: null,
      };
    }

    const info = await OrderService.getRefundInfo(orderId);
    if (!info) {
      return {
        success: false,
        message: "REFUND_NOT_REQUIRED",
        refundInfo: null,
      };
    }

    if (info.refunded) {
      return {
        success: false,
        message: "ALREADY_REFUNDED",
        refundInfo: info,
      };
    }

    await AuditLogService.logPaymentEvent({
      orderId,
      event: AuditLogService.events.REFUND_CONFIRMED,
      fromStatus: PAYMENT_STATUS.PAID,
      toStatus: PAYMENT_STATUS.PAID,
      metadata: {
        amount: info.amount,
        refunded: true,
        method: "manual_midtrans_dashboard",
      },
    });

    return {
      success: true,
      message: `Refund untuk ${orderId} ditandai selesai.`,
      refundInfo: { ...info, refunded: true },
    };
  },
};
