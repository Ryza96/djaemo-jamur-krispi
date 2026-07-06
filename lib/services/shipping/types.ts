export const SHIPPING_STATUS = {
  CONFIRMED: "confirmed",
  PICKING_UP: "picking_up",
  DROPPING_OFF: "dropping_off",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETRY: "retry",
} as const;

export type ShippingStatus = (typeof SHIPPING_STATUS)[keyof typeof SHIPPING_STATUS];

export const WEBHOOK_EVENT = {
  ORDER_PICKING_UP: "order.picking_up",
  ORDER_DROPPING_OFF: "order.dropping_off",
  ORDER_DELIVERED: "order.delivered",
  ORDER_RETRY: "order.retry",
  ORDER_CANCELLED: "order.cancelled",
} as const;

export type WebhookEvent = (typeof WEBHOOK_EVENT)[keyof typeof WEBHOOK_EVENT];

export interface BiteshipShipper {
  name: string;
  email: string;
  phone: string;
  address: string;
  postalCode: number;
  city: string;
}

export interface BiteshipDestination {
  contactName: string;
  contactPhone: string;
  address: string;
  postalCode: number;
  areaId?: string;
}

export interface BiteshipItem {
  name: string;
  quantity: number;
  value: number;
  weight: number;
}

export interface CreateShipmentParams {
  shipper: BiteshipShipper;
  destination: BiteshipDestination;
  courierCompany: string;
  courierService: string;
  deliveryType: "now" | "later" | "scheduled";
  items: BiteshipItem[];
}

export interface BiteshipOrderResponse {
  id: string;
  courier: {
    tracking_id: string;
    waybill_id: string;
    company: string;
    type: string;
    link: string;
  } | null;
  status: string;
}

export interface CreateShipmentResult {
  success: boolean;
  shipmentId: string | null;
  waybillId: string | null;
  trackingId: string | null;
  trackingLink: string | null;
  error?: string;
}

export interface BiteshipWebhookPayload {
  event: WebhookEvent;
  order_id: string;
  waybill_id: string;
  shipment_id: string;
  tracking_url: string | null;
  courier: string;
  status: string;
  updated_at: string;
}

export interface BiteshipTrackingHistoryEntry {
  status: string;
  updated_at: string;
  description?: string;
}

export interface BiteshipTrackingResponse {
  status: string;
  waybill_id: string;
  courier: string;
  history: BiteshipTrackingHistoryEntry[];
}

export interface TrackingInfo {
  status: string;
  waybillId: string;
  history: BiteshipTrackingHistoryEntry[];
}
