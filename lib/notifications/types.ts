import type { AuditEvent } from "@/lib/services/audit-log.service";

export type PaymentNotificationEvent = "payment.paid" | "payment.failed" | "payment.expired";
export type NotificationEvent = AuditEvent | PaymentNotificationEvent;

export interface RecipientInfo {
  name: string;
  email: string | null;
  phone: string | null;
}

export interface NotificationPayload {
  event: NotificationEvent;
  orderId: string;
  timestamp: string;

  customer: RecipientInfo;

  order: {
    orderId: string;
    totalAmount: number;
    subtotal: number;
    shippingFee: number;
    shippingAddress: string | null;
    createdAt: string;
  };

  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;

  payment?: {
    method: string | null;
    transactionId: string | null;
    paidAt: string | null;
  };

  shipment?: {
    waybillId: string | null;
    courier: string | null;
    courierType: string | null;
  };

  cancellation?: {
    reason: string | null;
  };
}

export interface ChannelResult {
  success: boolean;
  channelId: string;
  messageId?: string;
  error?: string;
  timestamp: string;
}

export interface NotificationChannel {
  readonly channelId: string;
  send(payload: NotificationPayload, recipient: RecipientInfo): Promise<ChannelResult>;
}
