import { OrderRepository } from "@/lib/repositories";
import type { NotificationEvent, NotificationPayload } from "./types";

export async function buildPayload(
  event: NotificationEvent,
  orderId: string,
): Promise<NotificationPayload | null> {
  const order = await OrderRepository.findDetailByOrderId(orderId);
  if (!order) return null;

  const payload: NotificationPayload = {
    event,
    orderId,
    timestamp: new Date().toISOString(),

    customer: {
      name: order.customer_name ?? "Pelanggan",
      email: order.customer_email ?? null,
      phone: order.customer_phone ?? null,
    },

    order: {
      orderId: order.order_id,
      totalAmount: order.total_amount,
      subtotal: order.subtotal,
      shippingFee: order.shipping_fee,
      shippingAddress: order.shipping_address,
      createdAt: order.created_at,
    },

    items: (order.order_items ?? []).map((item) => ({
      productName: item.product_name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
  };

  if (order.payment_method || order.transaction_id || order.paid_at) {
    payload.payment = {
      method: order.payment_method,
      transactionId: order.transaction_id,
      paidAt: order.paid_at,
    };
  }

  if (order.waybill_id || order.courier_company || order.courier_type) {
    payload.shipment = {
      waybillId: order.waybill_id,
      courier: order.courier_company,
      courierType: order.courier_type,
    };
  }

  if (order.cancellation_reason) {
    payload.cancellation = {
      reason: order.cancellation_reason,
    };
  }

  return payload;
}
