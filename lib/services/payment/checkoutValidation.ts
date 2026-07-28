import { findById } from "@/lib/repositories/product.repository";
import { rowToProduct } from "@/lib/services/product.service";
import { resolveTransactionPrice } from "@/lib/services/pricing-authority";
import { BITESHIP_API_BASE_URL, DEFAULT_COURIERS, getBiteshipApiKey } from "@/lib/services/shipping/constants";
import { getDestinationCoords } from "@/lib/services/shipping/getRates";
import type { CreatePaymentRequest } from "./types";

interface ValidatedCheckoutItem {
  product: {
    id: string;
    name: string;
    price: number;
    weight: string;
  };
  quantity: number;
}

export interface ValidatedCheckout {
  request: CreatePaymentRequest;
  items: ValidatedCheckoutItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
}

export class CheckoutValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CheckoutValidationError";
    this.status = status;
  }
}

interface RawBiteshipRate {
  courier_code?: unknown;
  courier?: unknown;
  company?: unknown;
  courier_service_name?: unknown;
  courier_service_code?: unknown;
  service?: unknown;
  price?: unknown;
  shipping_fee?: unknown;
}

interface BiteshipRatesResponse {
  pricing?: RawBiteshipRate[];
  message?: string;
  error?: string;
  errors?: unknown[];
}

const REQUEST_TIMEOUT_MS = 10000;

function extractWeightGrams(weight: string | undefined): number {
  const value = Number(weight?.replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 100;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function assertClientTotalsMatch(
  params: CreatePaymentRequest,
  calculatedSubtotal: number,
  calculatedShippingFee: number,
): void {
  if (params.subtotal !== calculatedSubtotal) {
    throw new CheckoutValidationError("Subtotal pesanan tidak valid.");
  }

  if (params.shippingFee !== calculatedShippingFee) {
    throw new CheckoutValidationError("Ongkos kirim tidak valid.");
  }
}

async function fetchBiteshipRates(params: {
  request: CreatePaymentRequest;
  items: ValidatedCheckoutItem[];
}): Promise<RawBiteshipRate[]> {
  const { request, items } = params;
  const destination =
    request.shippingAddress.latitude && request.shippingAddress.longitude
      ? {
          lat: request.shippingAddress.latitude,
          lng: request.shippingAddress.longitude,
        }
      : getDestinationCoords(request.shippingAddress.city);

  if (!destination) {
    throw new CheckoutValidationError(
      `Kota "${request.shippingAddress.city}" belum didukung.`,
    );
  }

  const apiKey = getBiteshipApiKey();
  const origin = {
    lat: Number(process.env.NEXT_PUBLIC_ORIGIN_LAT) || -7.1545,
    lng: Number(process.env.NEXT_PUBLIC_ORIGIN_LNG) || 111.8853,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BITESHIP_API_BASE_URL}/rates/couriers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin_latitude: origin.lat,
        origin_longitude: origin.lng,
        destination_latitude: destination.lat,
        destination_longitude: destination.lng,
        items: items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          value: item.product.price * item.quantity,
          weight: extractWeightGrams(item.product.weight),
        })),
        couriers: DEFAULT_COURIERS,
      }),
      signal: controller.signal,
    });

    const body = (await response.json()) as BiteshipRatesResponse;

    if (!response.ok) {
      const message =
        body.message ||
        body.error ||
        "Gagal memvalidasi ongkos kirim.";
      throw new CheckoutValidationError(message, response.status);
    }

    return Array.isArray(body.pricing) ? body.pricing : [];
  } catch (error) {
    if (error instanceof CheckoutValidationError) throw error;
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Timeout saat memvalidasi ongkos kirim."
        : "Gagal memvalidasi ongkos kirim.";
    throw new CheckoutValidationError(message, 502);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function validateShippingFee(params: {
  request: CreatePaymentRequest;
  items: ValidatedCheckoutItem[];
}): Promise<number> {
  const { request, items } = params;
  const rates = await fetchBiteshipRates({ request, items });
  const selectedCourier = normalizeText(request.shippingCourier);
  const selectedService = normalizeText(request.shippingService);

  const matchingRate = rates.find((rate) => {
    const courier = String(rate.courier_code || rate.courier || rate.company || "");
    const service = String(
      rate.courier_service_code ||
        rate.service ||
        rate.courier_service_name ||
        "",
    );
    return (
      normalizeText(courier) === selectedCourier &&
      normalizeText(service) === selectedService
    );
  });

  if (!matchingRate) {
    throw new CheckoutValidationError("Metode pengiriman tidak valid.");
  }

  const price = Number(matchingRate.price ?? matchingRate.shipping_fee ?? 0);
  if (!Number.isFinite(price) || price <= 0) {
    throw new CheckoutValidationError("Ongkos kirim tidak valid.");
  }

  return Math.round(price);
}

export async function validateCheckoutRequest(
  params: CreatePaymentRequest,
): Promise<ValidatedCheckout> {
  const items: ValidatedCheckoutItem[] = [];

  for (const item of params.items) {
    const row = await findById(item.product.id);
    if (!row) {
      throw new CheckoutValidationError("Produk tidak ditemukan.");
    }

    const product = rowToProduct(row);
    const resolution = await resolveTransactionPrice(product);

    if (item.product.price !== resolution.final_price) {
      throw new CheckoutValidationError("Harga produk tidak valid.");
    }

    items.push({
      product: {
        id: product.id,
        name: product.name,
        price: resolution.final_price,
        weight: product.weight,
      },
      quantity: item.quantity,
    });
  }

  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const shippingFee = await validateShippingFee({ request: params, items });

  assertClientTotalsMatch(params, subtotal, shippingFee);

  return {
    request: {
      ...params,
      items,
      subtotal,
      shippingFee,
    },
    items,
    subtotal,
    shippingFee,
    totalAmount: subtotal + shippingFee,
  };
}
