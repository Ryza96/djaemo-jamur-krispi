export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  EXPIRED: "expired",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const FULFILLMENT_STATUS = {
  NEW: "new",
  CONFIRMED: "confirmed",
  PACKING: "packing",
  WAYBILL_CREATED: "waybill_created",
  PICKED_UP: "picked_up",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  WAITING_FOR_RESTOCK: "waiting_for_restock",
} as const;

export type FulfillmentStatus =
  (typeof FULFILLMENT_STATUS)[keyof typeof FULFILLMENT_STATUS];

export const PAYMENT_STATUS_TRANSITIONS: Record<
  PaymentStatus,
  PaymentStatus[]
> = {
  // UNPAID -> PAID is allowed: a Midtrans settlement is a fact that must
  // always be processable, even if our DB never reached PENDING (e.g. the
  // confirm step failed after Snap creation).
  [PAYMENT_STATUS.UNPAID]: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PAID],
  [PAYMENT_STATUS.PENDING]: [
    PAYMENT_STATUS.PAID,
    PAYMENT_STATUS.FAILED,
    PAYMENT_STATUS.EXPIRED,
  ],
  [PAYMENT_STATUS.PAID]: [],
  [PAYMENT_STATUS.FAILED]: [],
  [PAYMENT_STATUS.EXPIRED]: [],
};

export interface CreatePaymentRequest {
  orderId: string;
  customerInfo: {
    name: string;
    whatsapp: string;
    email: string;
    notes?: string;
  };
  shippingAddress: {
    street: string;
    kelurahan: string;
    kecamatan: string;
    city: string;
    province: string;
    postalCode: string;
    areaId?: string;
    districtName?: string;
    latitude?: number;
    longitude?: number;
  };
  shippingCourier: string;
  shippingService: string;
  shippingFee: number;
  items: Array<{
    product: {
      id: string;
      name: string;
      price: number;
      weight?: string;
    };
    quantity: number;
  }>;
  subtotal: number;
}

export interface CreatePaymentResponse {
  success: boolean;
  orderId: string;
  token: string;
  redirectUrl: string;
}

export interface MidtransNotification {
  transaction_status: string;
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_id: string;
  payment_type: string;
  fraud_status: string;
  transaction_time: string;
  settlement_time?: string;
}

export interface CallbackResult {
  success: boolean;
  orderId: string;
  paymentStatus: PaymentStatus;
  message: string;
}

/**
 * Manual-refund tracking for orders that were cancelled after payment.
 * Derived from audit_logs metadata written by FulfillmentService.cancel:
 * - required=true  → an ORDER_CANCELLED entry carries refund_required:true
 * - refunded=true  → a later REFUND_CONFIRMED entry exists (admin marked
 *   the manual Midtrans Dashboard refund as done)
 */
export interface RefundInfo {
  required: boolean;
  refunded: boolean;
  amount: number | null;
}
