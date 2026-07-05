export const BITESHIP_API_BASE_URL = "https://api.biteship.com/v1";

export const DEFAULT_COURIERS = "jne,jnt,sicepat,anteraja,idexpress";

export const DEFAULT_ITEM_WEIGHT_GRAMS = 100;

export const BITESHIP_EVENT_TO_AUDIT_EVENT: Record<string, string> = {
  "order.picking_up": "shipment.picking_up",
  "order.dropping_off": "shipment.dropping_off",
  "order.delivered": "shipment.delivered",
  "order.retry": "shipment.retry",
  "order.cancelled": "shipment.cancelled",
};

export const BITESHIP_STATUS_TO_FULFILLMENT: Record<string, string> = {
  picking_up: "picked_up",
  dropping_off: "shipped",
  in_transit: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  retry: "shipped",
};

export function getBiteshipApiKey(): string {
  const key = process.env.BITESHIP_API_KEY;
  if (!key) {
    throw new Error("BITESHIP_API_KEY is not configured");
  }
  return key;
}

export function getShipperConfig() {
  return {
    name: process.env.BITESHIP_SHIPPER_NAME ?? "Jamur Krispi",
    email: process.env.BITESHIP_SHIPPER_EMAIL ?? "info@jamurkrispi.com",
    phone: process.env.BITESHIP_SHIPPER_PHONE ?? "+62812345678",
    address: process.env.BITESHIP_SHIPPER_ADDRESS ?? "",
    postalCode: Number(process.env.BITESHIP_SHIPPER_POSTAL) || 62193,
    city: process.env.BITESHIP_SHIPPER_CITY ?? "Bojonegoro",
  };
}

export function getCourierConfig() {
  return {
    company: process.env.BITESHIP_COURIER_COMPANY ?? "jne",
    service: process.env.BITESHIP_COURIER_TYPE ?? "reg",
    deliveryType: (process.env.BITESHIP_DELIVERY_TYPE ?? "later") as "now" | "later" | "scheduled",
  };
}
