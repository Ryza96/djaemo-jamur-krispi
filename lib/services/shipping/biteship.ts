import {
  BITESHIP_API_BASE_URL,
  getBiteshipApiKey,
} from "./constants";
import type {
  CreateShipmentParams,
  BiteshipOrderResponse,
  BiteshipTrackingResponse,
} from "./types";

const REQUEST_TIMEOUT_MS = 15000;

async function fetchBiteship<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const apiKey = getBiteshipApiKey();
  const url = `${BITESHIP_API_BASE_URL}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...options.headers,
      },
      signal: controller.signal,
    });

    const body = await res.json();

    if (!res.ok) {
      const message =
        body?.error || body?.message || `Biteship API error (${res.status})`;
      throw new Error(message);
    }

    return body as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function createShipment(
  params: CreateShipmentParams,
): Promise<BiteshipOrderResponse> {
  const payload: Record<string, unknown> = {
    shipper_contact_name: params.shipper.name,
    shipper_contact_phone: params.shipper.phone,
    shipper_contact_email: params.shipper.email,
    origin_contact_name: params.shipper.name,
    origin_contact_phone: params.shipper.phone,
    origin_address: params.shipper.address,
    origin_postal_code: params.shipper.postalCode,
    origin_area_id: undefined,
    destination_contact_name: params.destination.contactName,
    destination_contact_phone: params.destination.contactPhone,
    destination_address: params.destination.address,
    destination_postal_code: params.destination.postalCode,
    destination_area_id: params.destination.areaId ?? undefined,
    courier_company: params.courierCompany,
    courier_type: params.courierService,
    delivery_type: params.deliveryType,
    items: params.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      value: item.value,
      weight: item.weight,
    })),
  };

  return fetchBiteship<BiteshipOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTracking(
  waybillId: string,
): Promise<BiteshipTrackingResponse> {
  return fetchBiteship<BiteshipTrackingResponse>(
    `/orders/${encodeURIComponent(waybillId)}/tracking`,
  );
}
