import { getDestinationCoords } from "@/lib/services/shipping/getRates";
import type {
  CheckoutState,
  CustomerInfo,
  ShippingAddress,
} from "@/types/checkout";

const RESUMABLE_STATUSES = new Set(["unpaid", "pending"]);

export interface RestoredOrderData {
  order_id?: string | null;
  payment_status?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  notes?: string | null;
  shipping_address?: string | null;
  destination?: string | null;
  postal_code?: string | null;
  destination_area_id?: string | null;
  courier_company?: string | null;
  courier_type?: string | null;
  shipping_cost?: number | null;
  shipping_fee?: number | null;
  customers?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export function isResumableOrder(
  paymentStatus: string | null | undefined,
): boolean {
  return !!paymentStatus && RESUMABLE_STATUSES.has(paymentStatus);
}

export function parseStoredAddress(
  combined: string | null | undefined,
  destination?: string | null,
  postalCode?: string | null,
  areaId?: string | null,
): ShippingAddress {
  if (!combined) {
    return {
      street: "",
      kelurahan: "",
      kecamatan: "",
      city: destination ?? "",
      province: "",
      postalCode: postalCode ?? "",
      areaId: areaId ?? "",
      districtName: "",
      latitude: 0,
      longitude: 0,
    };
  }

  const parts = combined
    .split(", ")
    .map((s) => s.trim())
    .filter(Boolean);

  let postal = parts.pop() ?? "";
  const province = parts.pop() ?? "";
  let city = parts.pop() ?? "";
  let kelurahan = "";
  let kecamatan = "";

  if (parts.length > 0 && parts[parts.length - 1].startsWith("Kec. ")) {
    kecamatan = (parts.pop() as string).slice(5);
  }
  if (parts.length > 0 && parts[parts.length - 1].startsWith("Kel. ")) {
    kelurahan = (parts.pop() as string).slice(5);
  }

  const street = parts.join(", ");

  if (!postal && postalCode) postal = postalCode;
  if (!city && destination) city = destination;
  const coords = getDestinationCoords(city);

  return {
    street,
    kelurahan,
    kecamatan,
    city,
    province,
    postalCode: postal,
    areaId: areaId ?? "",
    districtName: kecamatan,
    latitude: coords?.lat ?? 0,
    longitude: coords?.lng ?? 0,
  };
}

export function restoreToCheckout(
  order: RestoredOrderData,
): Pick<
  CheckoutState,
  | "customerInfo"
  | "shippingAddress"
  | "shippingCourier"
  | "shippingService"
  | "shippingFee"
> {
  const customerInfo: CustomerInfo = {
    name: order.customer_name ?? order.customers?.name ?? "",
    whatsapp: order.customer_phone ?? order.customers?.phone ?? "",
    email: order.customer_email ?? order.customers?.email ?? "",
    notes: order.notes ?? "",
  };

  return {
    customerInfo,
    shippingAddress: parseStoredAddress(
      order.shipping_address,
      order.destination,
      order.postal_code,
      order.destination_area_id,
    ),
    shippingCourier: order.courier_company ?? "",
    shippingService: order.courier_type ?? "",
    shippingFee: Number(order.shipping_cost ?? order.shipping_fee ?? 0),
  };
}
