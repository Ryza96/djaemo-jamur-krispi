import { OrderRepository, CustomerRepository } from "@/lib/repositories";
import { combineAddress, mapMidtransStatus } from "./payment/mapper";
import { verifyMidtransSignature } from "./payment/verifySignature";
import { AuditLogService } from "./audit-log.service";
import { PAYMENT_STATUS, FULFILLMENT_STATUS } from "./payment/types";
import type {
  PaymentStatus,
  FulfillmentStatus,
  MidtransNotification,
  CreatePaymentRequest,
} from "./payment/types";

export interface CreateOrderResult {
  id: string;
  orderId: string;
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
      subtotal: params.subtotal,
      shipping_fee: params.shippingFee,
      total_amount: totalAmount,
      destination: params.shippingAddress.city,
      shipping_service: `${params.shippingCourier} ${params.shippingService}`,
      courier_company: params.shippingCourier,
      courier_type: params.shippingService,
      shipping_cost: params.shippingFee,
      customer_phone: params.customerInfo.whatsapp,
      shipping_address: fullAddress,
      notes: params.customerInfo.notes || null,
      payment_status: PAYMENT_STATUS.UNPAID,
      fulfillment_status: FULFILLMENT_STATUS.NEW,
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
      await OrderRepository.deleteById(order.id);
      throw new Error("ORDER_ITEMS_FAILED");
    }

    await AuditLogService.logPaymentEvent({
      orderId: params.orderId,
      event: AuditLogService.events.ORDER_CREATED,
      fromStatus: null,
      toStatus: PAYMENT_STATUS.UNPAID,
    });

    return { id: order.id, orderId: params.orderId };
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

    const validTransitions: Record<string, PaymentStatus[]> = {
      [PAYMENT_STATUS.UNPAID]: [PAYMENT_STATUS.PENDING],
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
    if (!allowed?.includes(newStatus)) {
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

    await OrderRepository.updatePaymentByOrderId(order_id, {
      payment_status: newStatus,
      transaction_id: notification.transaction_id || order.transaction_id!,
      payment_method: notification.payment_type || null,
    });

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
};
