import type { ShippingRate } from "@/types/checkout";
import type {
  CreateShipmentParams,
  BiteshipOrderResponse,
  CreateShipmentResult,
  BiteshipWebhookPayload,
  BiteshipShipper,
  BiteshipDestination,
  BiteshipItem,
} from "./types";
import type { OrderDetailRow } from "@/lib/repositories/order.repository";

// ===== Legacy exports (used by checkout rate display) =====

export interface RawRate {
  courier: string | null;
  service: string | null;
  price: number | null;
  etd: string | null;
}

export function mapBiteshipRates(raw: RawRate[]): ShippingRate[] {
  return raw
    .filter((r) => r.courier && r.service && r.price != null && r.price > 0)
    .map((r, idx) => ({
      id: `${r.courier}-${r.service}-${idx}`,
      courier: r.courier!,
      service: r.service!,
      price: r.price!,
      etd: r.etd,
    }));
}

export function groupByCourier(
  rates: ShippingRate[],
): Map<string, ShippingRate[]> {
  const grouped = new Map<string, ShippingRate[]>();
  for (const rate of rates) {
    const existing = grouped.get(rate.courier) ?? [];
    existing.push(rate);
    grouped.set(rate.courier, existing);
  }
  return grouped;
}

export function formatEtd(etd: string | null): string {
  if (!etd) return "";
  const match = etd.match(/(\d+)/);
  if (!match) return etd;
  const days = Number(match[1]);
  if (days <= 1) return "1 hari";
  return `${days} hari`;
}

// ===== New shipping foundation exports =====

export function mapOrderToBiteshipRequest(
  order: OrderDetailRow,
  shipper: BiteshipShipper,
  deliveryType: "now" | "later" | "scheduled",
): CreateShipmentParams {
  const customer = order.customers;
  const items: BiteshipItem[] = (order.order_items ?? []).map((item) => {
    if (item.weight_grams == null) {
      throw new Error("PRODUCT_WEIGHT_REQUIRED");
    }
    return {
      name: item.product_name,
      quantity: item.quantity,
      value: item.subtotal,
      weight: item.weight_grams,
    };
  });

  const postalCodeStr = order.postal_code;
  if (!postalCodeStr) {
    throw new Error("POSTAL_CODE_REQUIRED");
  }

  const destination: BiteshipDestination = {
    contactName: customer?.name ?? "Penerima",
    contactPhone: order.customer_phone ?? customer?.phone ?? "",
    address: order.shipping_address ?? customer?.address ?? "",
    postalCode: Number(postalCodeStr),
    areaId: order.destination_area_id ?? undefined,
  };

  return {
    shipper,
    destination,
    courierCompany: order.courier_company ?? "jne",
    courierService: order.courier_type ?? "reg",
    deliveryType,
    items,
  };
}

export function mapBiteshipResponse(
  response: BiteshipOrderResponse,
): CreateShipmentResult {
  return {
    success: true,
    shipmentId: response.id,
    waybillId: response.courier?.waybill_id ?? null,
    trackingId: response.courier?.tracking_id ?? null,
    trackingLink: response.courier?.link ?? null,
  };
}

export function mapWebhookToAuditPayload(
  webhook: BiteshipWebhookPayload,
): {
  event: string;
  fromStatus: string;
  toStatus: string;
  metadata: Record<string, unknown>;
} {
  return {
    event: `shipment.${webhook.status}`,
    fromStatus: "waybill_created",
    toStatus: mapBiteshipStatusToFulfillment(webhook.status),
    metadata: {
      shipment_id: webhook.shipment_id,
      waybill_id: webhook.waybill_id,
      shipping_status: webhook.status,
    },
  };
}

export function mapBiteshipStatusToFulfillment(
  status: string,
): string {
  const map: Record<string, string> = {
    picking_up: "picked_up",
    dropping_off: "shipped",
    in_transit: "shipped",
    delivered: "delivered",
    cancelled: "cancelled",
    retry: "shipped",
  };
  return map[status] ?? "shipped";
}
