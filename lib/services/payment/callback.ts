import { supabase } from "@/lib/supabase";
import { verifyMidtransSignature } from "./verifySignature";
import { mapMidtransStatus } from "./mapper";
import { PAYMENT_STATUS } from "./types";
import type {
  MidtransNotification,
  CallbackResult,
} from "./types";

export async function processPaymentCallback(
  notification: MidtransNotification,
): Promise<CallbackResult> {
  const { order_id, status_code, gross_amount, signature_key } = notification;

  const isValid = verifyMidtransSignature({
    orderId: order_id,
    statusCode: status_code,
    grossAmount: gross_amount,
    signatureKey: signature_key,
  });

  if (!isValid) {
    return {
      success: false,
      orderId: order_id,
      paymentStatus: PAYMENT_STATUS.FAILED,
      message: "Invalid signature",
    };
  }

  const { data: existing } = await supabase
    .from("orders")
    .select("payment_status, transaction_id")
    .eq("order_id", order_id)
    .single();

  if (!existing) {
    return {
      success: false,
      orderId: order_id,
      paymentStatus: PAYMENT_STATUS.FAILED,
      message: "Order not found",
    };
  }

  if (existing.payment_status === PAYMENT_STATUS.PAID) {
    return {
      success: true,
      orderId: order_id,
      paymentStatus: PAYMENT_STATUS.PAID,
      message: "Order already paid, skipping duplicate callback",
    };
  }

  const paymentStatus = mapMidtransStatus(notification.transaction_status);

  const updates: Record<string, string | null> = {
    payment_status: paymentStatus,
    transaction_id: notification.transaction_id || existing.transaction_id,
    payment_method: notification.payment_type || null,
    updated_at: new Date().toISOString(),
  };

  if (paymentStatus === PAYMENT_STATUS.PAID && notification.settlement_time) {
    updates.paid_at = notification.settlement_time;
  }

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("order_id", order_id);

  if (error) {
    return {
      success: false,
      orderId: order_id,
      paymentStatus,
      message: `Failed to update order: ${error.message}`,
    };
  }

  return {
    success: true,
    orderId: order_id,
    paymentStatus,
    message: `Order status updated to ${paymentStatus}`,
  };
}
