import { OrderRepository, CustomerRepository } from "@/lib/repositories";
import { AuditLogRepository } from "@/lib/repositories/audit-log.repository";
import { maybeNotifyAdmin, maybeNotifyAdminOfStockShortage, ADMIN_WA_CHANNEL_ID } from "@/lib/notifications/admin-wa";
import { formatAdminWaMessage, formatNewCodOrderWaMessage } from "@/lib/notifications/channels/whatsapp/admin-formatter";
import { combineAddress, mapMidtransStatus } from "./payment/mapper";
import { extractWeightGrams } from "./shipping/constants";
import { verifyMidtransSignature } from "./payment/verifySignature";
import { isTransactionSettledAtMidtrans } from "./payment/midtrans-verify";
import { AuditLogService } from "./audit-log.service";
import { FulfillmentService, normalizeFulfillmentStatus, STOCK_DEDUCTED_STATUSES } from "./fulfillment.service";
import { after } from "next/server";
import { PAYMENT_STATUS, FULFILLMENT_STATUS } from "./payment/types";

import type {
  PaymentStatus,
  FulfillmentStatus,
  MidtransNotification,
  CreatePaymentRequest,
  RefundInfo,
} from "./payment/types";
import type { OrderRow } from "@/lib/repositories/order.repository";

export interface CreateOrderResult {
  id: string;
  orderId: string;
  accessToken: string;
}

export interface VoucherSnapshot {
  voucherCode: string;
  voucherDiscountPercent: number;
  discountAmount: number;
}

export interface ProcessCallbackResult {
  success: boolean;
  orderId: string;
  paymentStatus: PaymentStatus;
  message: string;
}

const ADMIN_WA_EVENT = "payment.paid";
const ADMIN_WA_COD_EVENT = "order.cod_new";

/**
 * Fire-and-forget WhatsApp notification to the admin when an order becomes
 * PAID. Runs entirely outside the payment-critical path: it never throws and
 * is always invoked without `await`, so a failure here can never fail, retry
 * or roll back the Midtrans callback / transaction.
 *
 * Notification failures are swallowed and recorded in `notification_log`
 * (status 'failed') so they are visible via the Supabase dashboard without
 * ever disturbing the payment flow.
 */
async function maybeNotifyAdminOfNewPayment(
  orderId: string,
  fromStatus: PaymentStatus | string | null,
): Promise<void> {
  await maybeNotifyAdmin({
    orderId,
    event: ADMIN_WA_EVENT,
    channelId: ADMIN_WA_CHANNEL_ID,
    logContext: { fromStatus },
    buildMessage: formatAdminWaMessage,
  });
}

/**
 * Fire-and-forget WhatsApp notification to the admin when a new COD order is
 * created. Same safety contract as maybeNotifyAdminOfNewPayment: never
 * throws, never blocks the checkout response; idempotent per
 * (order.cod_new, order_id, whatsapp-admin).
 */
async function maybeNotifyAdminOfNewCodOrder(orderId: string): Promise<void> {
  await maybeNotifyAdmin({
    orderId,
    event: ADMIN_WA_COD_EVENT,
    channelId: ADMIN_WA_CHANNEL_ID,
    buildMessage: formatNewCodOrderWaMessage,
  });
}

const CHARGEBACK_AUTO_CANCEL_STATUSES = new Set<FulfillmentStatus>([
  FULFILLMENT_STATUS.NEW,
  FULFILLMENT_STATUS.CONFIRMED,
  FULFILLMENT_STATUS.PACKING,
  FULFILLMENT_STATUS.WAITING_FOR_RESTOCK,
]);
const CHARGEBACK_ADMIN_ACTION_STATUSES = new Set<FulfillmentStatus>([
  FULFILLMENT_STATUS.WAYBILL_CREATED,
  FULFILLMENT_STATUS.PICKED_UP,
  FULFILLMENT_STATUS.SHIPPED,
  FULFILLMENT_STATUS.DELIVERED,
]);

export const OrderService = {
  // Admin WA untuk order COD baru — dipanggil fire-and-forget dari
  // app/api/payment/create/route.ts lewat after().
  notifyNewCodOrder: maybeNotifyAdminOfNewCodOrder,

  async createDraft(
    params: CreatePaymentRequest,
    initialFulfillmentStatus: FulfillmentStatus = FULFILLMENT_STATUS.NEW,
    voucherInfo?: VoucherSnapshot,
  ): Promise<CreateOrderResult> {
    const existing = await OrderRepository.findByOrderId(params.orderId);
    if (existing) {
      throw new Error("ORDER_ID_EXISTS");
    }

    const fullAddress = combineAddress(params.shippingAddress);
    const discountAmount = voucherInfo?.discountAmount ?? 0;
    const paymentMethod = params.paymentMethod === "cod" ? "cod" : "online";
    const codFee = paymentMethod === "cod" ? (params.codFee ?? 0) : 0;
    const totalAmount =
      params.subtotal + params.shippingFee + codFee - discountAmount;

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
      payment_method:
        paymentMethod === "cod" ? paymentMethod : null,
      fulfillment_status: initialFulfillmentStatus,
      destination_area_id: params.shippingAddress.areaId ?? null,
      voucher_code: voucherInfo?.voucherCode ?? null,
      voucher_discount_percent: voucherInfo?.voucherDiscountPercent ?? null,
      discount_amount: discountAmount,
    });

    const orderItems = params.items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
      weight_grams: extractWeightGrams(item.product.weight),
    }));

    let insertItemsError: unknown;
    try {
      await OrderRepository.insertItems(orderItems);
    } catch (err) {
      insertItemsError = err;
      try {
        await OrderRepository.deleteById(order.id);
      } catch (rollbackError) {
        console.error(
          "[CRITICAL] Order rollback failed: order_items insert failed and cleanup also failed; order is orphaned without items and requires manual intervention.",
          {
            dbOrderId: order.id,
            orderId: params.orderId,
            insertItemsError:
              insertItemsError instanceof Error
                ? insertItemsError.message
                : String(insertItemsError),
            rollbackError:
              rollbackError instanceof Error
                ? rollbackError.message
                : String(rollbackError),
          },
        );
      }
      throw new Error("ORDER_ITEMS_FAILED");
    }

    try {
      await AuditLogService.logPaymentEvent({
        orderId: params.orderId,
        event: AuditLogService.events.ORDER_CREATED,
        fromStatus: null,
        toStatus: PAYMENT_STATUS.UNPAID,
      });
    } catch (err) {
      console.error(
        "[WARN] Order created but order.created audit event failed to persist.",
        {
          dbOrderId: order.id,
          orderId: params.orderId,
          error: err instanceof Error ? err.message : String(err),
        },
      );
    }

    if (initialFulfillmentStatus === FULFILLMENT_STATUS.WAITING_FOR_RESTOCK) {
      after(() => maybeNotifyAdminOfStockShortage(params.orderId).catch(() => {}));
    }

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

  /**
   * Mark a COD order as awaiting manual confirmation once the courier
   * reports the parcel as delivered. Never touches an order that is not
   * COD; a no-op success is returned for non-COD orders so the caller can
   * treat it as a normal delivered event.
   */
  async markCodDeliveredAwaitingConfirmation(
    orderId: string,
    waybillId?: string | null,
  ): Promise<{ success: boolean; message: string }> {
    const order = await OrderRepository.findByOrderId(orderId);
    if (!order) {
      return { success: false, message: "ORDER_NOT_FOUND" };
    }

    if ((order.payment_method ?? "").toLowerCase() !== "cod") {
      return { success: true, message: "NOT_COD_ORDER" };
    }

    const currentStatus = (order.payment_status ?? "").toLowerCase();

    if (currentStatus === PAYMENT_STATUS.PAID) {
      return { success: true, message: "ORDER_ALREADY_PAID" };
    }

    if (
      currentStatus !== PAYMENT_STATUS.UNPAID &&
      currentStatus !== PAYMENT_STATUS.PENDING
    ) {
      return {
        success: true,
        message: `ALREADY_COD_AWAITING (current: ${currentStatus})`,
      };
    }

    const updatedRows = await OrderRepository.updatePaymentByOrderIdIf(
      orderId,
      { payment_status: PAYMENT_STATUS.CODAWAITING_CONFIRMATION },
      [PAYMENT_STATUS.UNPAID, PAYMENT_STATUS.PENDING],
    );

    if (updatedRows === 0) {
      return { success: false, message: "ORDER_CONCURRENT_MODIFICATION" };
    }

    await AuditLogService.logPaymentEvent({
      orderId,
      event: AuditLogService.events.SHIPPING_DELIVERED_COD_PENDING,
      fromStatus: currentStatus,
      toStatus: PAYMENT_STATUS.CODAWAITING_CONFIRMATION,
      metadata: {
        waybill_id: waybillId ?? null,
        note: "Paket diterima kurir; menunggu konfirmasi admin untuk pelunasan COD.",
      },
    });

    return {
      success: true,
      message: `Order ${orderId} menunggu konfirmasi pelunasan COD.`,
    };
  },

  /**
   * Admin confirms that a COD order has been paid in person (lunas saat
   * pengantaran). Used by the admin order-action route. Only valid for
   * orders with payment_method = cod whose courier has already reported
   * delivery (`cod_awaiting_confirmation`); an order that is still
   * UNPAID/not yet delivered must NOT be markable as paid, and never for
   * Midtrans-paid orders.
   */
  async confirmCodPayment(orderId: string): Promise<{
    success: boolean;
    previousStatus: PaymentStatus | null;
    newStatus: PaymentStatus;
    message: string;
  }> {
    const order = await OrderRepository.findByOrderId(orderId);
    if (!order) {
      return {
        success: false,
        previousStatus: null,
        newStatus: PAYMENT_STATUS.PAID,
        message: "ORDER_NOT_FOUND",
      };
    }

    const currentStatus = (order.payment_status ?? "").toLowerCase() as PaymentStatus;

    if ((order.payment_method ?? "").toLowerCase() !== "cod") {
      return {
        success: false,
        previousStatus: currentStatus,
        newStatus: PAYMENT_STATUS.PAID,
        message: "NOT_COD_ORDER",
      };
    }

    if (currentStatus === PAYMENT_STATUS.PAID) {
      return {
        success: false,
        previousStatus: currentStatus,
        newStatus: PAYMENT_STATUS.PAID,
        message: "ORDER_ALREADY_PAID",
      };
    }

    if (currentStatus !== PAYMENT_STATUS.CODAWAITING_CONFIRMATION) {
      return {
        success: false,
        previousStatus: currentStatus,
        newStatus: PAYMENT_STATUS.PAID,
        message:
          currentStatus === PAYMENT_STATUS.UNPAID
            ? "Order belum dikirim/diterima kurir. Konfirmasi COD hanya bisa dilakukan setelah paket berstatus terkirim."
            : `ORDER_NOT_CONFIRMABLE (current: ${currentStatus})`,
      };
    }

    const updatedRows = await OrderRepository.updatePaymentByOrderIdIf(
      orderId,
      { payment_status: PAYMENT_STATUS.PAID },
      [PAYMENT_STATUS.CODAWAITING_CONFIRMATION],
    );

    if (updatedRows === 0) {
      const latest = await OrderRepository.findByOrderId(orderId);
      const latestStatus = (
        latest?.payment_status ?? ""
      ).toLowerCase() as PaymentStatus;
      if (latestStatus === PAYMENT_STATUS.PAID) {
        return {
          success: true,
          previousStatus: currentStatus,
          newStatus: PAYMENT_STATUS.PAID,
          message: "ORDER_ALREADY_PAID",
        };
      }
      return {
        success: false,
        previousStatus: currentStatus,
        newStatus: PAYMENT_STATUS.PAID,
        message: `ORDER_CONCURRENT_MODIFICATION (current: ${latestStatus})`,
      };
    }

    await AuditLogService.logPaymentEvent({
      orderId,
      event: AuditLogService.events.PAYMENT_MANUAL_CONFIRM,
      fromStatus: currentStatus,
      toStatus: PAYMENT_STATUS.PAID,
      metadata: {
        method: "cod",
        amount: order.total_amount,
        confirmed_by: "admin",
      },
    });

    return {
      success: true,
      previousStatus: currentStatus,
      newStatus: PAYMENT_STATUS.PAID,
      message: `Order ${orderId} ditandai lunas (COD).`,
    };
  },

  async expireUnpaidOrder(
    orderId: string,
    reason: string = "payment_expired",
    options?: { autoExpire?: boolean },
  ): Promise<{ success: boolean; message: string }> {
    let order = await OrderRepository.findByOrderId(orderId);
    if (!order) {
      return { success: false, message: "ORDER_NOT_FOUND" };
    }

    // Order COD tidak pernah tunduk pada auto-expire berbasis waktu (umur
    // 8 jam token Midtrans Snap). Pembayaran COD secara sah menunggu
    // pengantaran + konfirmasi admin, jadi status "unpaid" bisa bertahan
    // berhari-hari tanpa ini berarti order ditinggalkan.
    const isCod = (order.payment_method ?? "").toLowerCase() === "cod";
    if (isCod && options?.autoExpire) {
      return {
        success: false,
        message: "COD_ORDER_NOT_SUBJECT_TO_AUTO_EXPIRY",
      };
    }

    // Defense-in-depth tambahan: COD yang fulfillment-nya sudah melewati
    // tahap persiapan (resi dibuat ke atas) TIDAK boleh di-expire lewat
    // jalur apapun. Pembatalan dari status itu invalid di
    // FulfillmentService (transisi waybill_created/picked_up/shipped ->
    // cancelled tidak ada), sehingga mencoba expire hanya menghasilkan
    // state rusak: payment_status jadi "failed" tapi fulfillment masih
    // jalan/delivered. Pembatalan manual COD hanya sah dari status
    // new/confirmed/packing/waiting_for_restock (sesuai UI success page).
    if (isCod) {
      const codFulfillment = (order.fulfillment_status ?? "").toLowerCase();
      if (
        ["waybill_created", "picked_up", "shipped", "delivered"].includes(
          codFulfillment,
        )
      ) {
        return {
          success: false,
          message: "COD_ORDER_NOT_EXPIRABLE_AFTER_SHIPMENT",
        };
      }
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

    // Visibility for a known edge case: when this order was previously
    // cancelled/expired/failed, its reserved voucher usage was RELEASED back
    // to the voucher (voucher_usage_released = TRUE). If the customer then
    // pays and the order is recovered to success, the released slot is NOT
    // re-applied (accepted as a small business risk). We only LOG this so
    // admins can see the potential 1-slot overshoot. This is notification
    // ONLY — we deliberately do not re-apply quota here.
    if (
      order &&
      order.voucher_code &&
      order.voucher_usage_released === true
    ) {
      await AuditLogService.logPaymentEvent({
        orderId,
        event: AuditLogService.events.VOUCHER_USAGE_RELEASED_ON_RECOVERY,
        fromStatus: "expired_or_failed",
        toStatus: PAYMENT_STATUS.PAID,
        metadata: {
          reason,
          recovery: "midtrans_race_recovery",
          voucher_code: order.voucher_code,
          note: "voucher usage was released during cancellation and is NOT re-applied; potential 1-slot quota overshoot",
        },
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

    // INTERCEPT chargeback/partial_chargeback SEBELUM cek gross_amount dan tabel transisi inline.
    // partial_chargeback diperlakukan SAMA dengan chargeback penuh. Selisih gross_amount vs
    // total_amount tidak menolak notifikasi; dicatat di metadata audit oleh handleChargeback.
    if (
      notification.transaction_status === "chargeback" ||
      notification.transaction_status === "partial_chargeback"
    ) {
      return OrderService.handleChargeback(order, notification);
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

      after(() => maybeNotifyAdminOfNewPayment(order_id, currentStatus));

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

    if (newStatus === PAYMENT_STATUS.PAID) {
      after(() => maybeNotifyAdminOfNewPayment(order_id, currentStatus));
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
   * Menangani notifikasi chargeback/partial_chargeback (keputusan final: keduanya → FAILED).
   * Batasan yang disadari: signature Midtrans = SHA512(order_id + status_code + gross_amount +
   * serverKey), jadi transaction_status TIDAK ikut ditandatangani. Sengaja TIDAK menambah
   * verifikasi GET status ke Midtrans (berbeda dari jalur recovery di processCallback).
   * Pelindung: (a) hanya berlaku untuk payment_status PAID; (b) transisi PAID→FAILED hanya sekali
   * lewat updatePaymentByOrderIdIf (winner-takes-all); (c) auto-cancel hanya setelah update menang
   * 1 baris, lewat SATU jalur (FulfillmentService.cancel) agar stok tidak ter-restore dua kali.
   * Catatan: FulfillmentService.cancel tidak mengekspos PARTIAL_RESTORE_FAILURE; kegagalan restore
   * parsial hanya terlihat pada audit ROLLBACK yang ditulis executeTransition.
   */
  async handleChargeback(
    order: OrderRow,
    notification: MidtransNotification,
  ): Promise<ProcessCallbackResult> {
    const isCod = (order.payment_method ?? "").toLowerCase() === "cod";
    const currentStatus = (order.payment_status ?? order.status) as PaymentStatus;

    if (isCod) {
      await AuditLogService.logPaymentEvent({
        orderId: order.order_id,
        event: AuditLogService.events.PAYMENT_CHARGEBACK,
        fromStatus: currentStatus,
        toStatus: currentStatus,
        metadata: {
          transaction_status: notification.transaction_status,
          reason: "cod_noop",
          note: "Order COD; tidak diubah oleh chargeback.",
        },
      });
      return { success: true, orderId: order.order_id, paymentStatus: currentStatus, message: "COD order unchanged" };
    }

    if (currentStatus !== PAYMENT_STATUS.PAID) {
      // Mencakup chargeback ulang saat sudah FAILED dan order online yang belum paid.
      await AuditLogService.logPaymentEvent({
        orderId: order.order_id,
        event: AuditLogService.events.CALLBACK_SKIPPED,
        fromStatus: currentStatus,
        toStatus: currentStatus,
        metadata: { reason: "chargeback_non_paid", transaction_status: notification.transaction_status },
      });
      return { success: true, orderId: order.order_id, paymentStatus: currentStatus, message: "Non-paid order unchanged" };
    }

    // Anti-race + anti-restore-ganda: hanya pemenang yang mendapat 1 baris.
    const updatedRows = await OrderRepository.updatePaymentByOrderIdIf(
      order.order_id,
      { payment_status: PAYMENT_STATUS.FAILED },
      [PAYMENT_STATUS.PAID],
    );

    if (updatedRows === 0) {
      await AuditLogService.logPaymentEvent({
        orderId: order.order_id,
        event: AuditLogService.events.CALLBACK_SKIPPED,
        fromStatus: PAYMENT_STATUS.PAID,
        toStatus: PAYMENT_STATUS.FAILED,
        metadata: { reason: "chargeback_race_lost" },
      });
      return { success: true, orderId: order.order_id, paymentStatus: PAYMENT_STATUS.FAILED, message: "Chargeback skipped (concurrent change)" };
    }

    const fulfillmentStatus = normalizeFulfillmentStatus(order.fulfillment_status);
    const rawGross = Number(notification.gross_amount);
    const grossNumber = Number.isFinite(rawGross) ? Math.round(rawGross) : order.total_amount;
    const grossDiff = grossNumber - order.total_amount;

    let stockRestoreAttempted = false;
    let requiresAdminAction = false;
    let autoCancelFailed = false;
    let autoCancelError: string | undefined;
    let adminActionReason: string | null = null;
    let adminActionNote: string | null = null;

    if (fulfillmentStatus && CHARGEBACK_AUTO_CANCEL_STATUSES.has(fulfillmentStatus)) {
      // Belum ada resi: satu jalur saja (cancel) agar restore terjadi maksimal sekali dan
      // cancel ulang oleh admin mustahil (cancelled → cancelled invalid).
      try {
        const cancelResult = await FulfillmentService.cancel(order.order_id, "otomatis_chargeback");
        if (cancelResult.success) {
          stockRestoreAttempted = STOCK_DEDUCTED_STATUSES.has(fulfillmentStatus);
        } else {
          autoCancelFailed = true;
          autoCancelError = cancelResult.message;
          requiresAdminAction = true;
          adminActionReason = "auto_cancel_failed";
        }
      } catch (err) {
        autoCancelFailed = true;
        autoCancelError = err instanceof Error ? err.message : "CHARGEBACK_CANCEL_FAILED";
        requiresAdminAction = true;
        adminActionReason = "auto_cancel_failed";
      }
    } else if (fulfillmentStatus && CHARGEBACK_ADMIN_ACTION_STATUSES.has(fulfillmentStatus)) {
      // waybill_created atau lebih lanjut: tanpa restore, fulfillment tidak diubah; pemilik menindaklanjuti manual.
      requiresAdminAction = true;
      adminActionReason = "fulfillment_past_waybill";
    } else if (fulfillmentStatus === FULFILLMENT_STATUS.CANCELLED) {
      // getRefundInfo diturunkan dari audit log (ORDER_CANCELLED refund_required + REFUND_CONFIRMED),
      // BUKAN dari payment_status, sehingga kewajiban refund lama tetap terbuka walau payment kini FAILED.
      requiresAdminAction = true;
      adminActionReason = "already_cancelled";
      adminActionNote =
        "Order sudah cancelled sebelum chargeback. Bank sudah menarik dana; JANGAN lakukan refund manual lagi jika ada kewajiban refund yang masih terbuka.";
    } else {
      requiresAdminAction = true;
      adminActionReason = "unknown_fulfillment_status";
    }

    // Audit SELALU ditulis, apa pun hasil auto-cancel.
    await AuditLogService.logPaymentEvent({
      orderId: order.order_id,
      event: AuditLogService.events.PAYMENT_CHARGEBACK,
      fromStatus: PAYMENT_STATUS.PAID,
      toStatus: PAYMENT_STATUS.FAILED,
      metadata: {
        transaction_status: notification.transaction_status,
        gross_amount: notification.gross_amount,
        total_amount: order.total_amount,
        gross_diff: grossDiff,
        refund_amount: notification.refund_amount ?? null,
        refunds: notification.refunds ?? null,
        fulfillment_status: order.fulfillment_status,
        stock_restore_attempted: stockRestoreAttempted,
        requiresAdminAction,
        admin_action_reason: adminActionReason,
        admin_action_note: adminActionNote,
        auto_cancel_failed: autoCancelFailed,
        auto_cancel_error: autoCancelError ?? null,
        note: "Selisih gross_amount vs total_amount dicatat; tidak menolak notifikasi.",
      },
    });

    return { success: true, orderId: order.order_id, paymentStatus: PAYMENT_STATUS.FAILED, message: "Order marked FAILED after chargeback" };
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
