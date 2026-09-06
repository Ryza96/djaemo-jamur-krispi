import { findById } from "@/lib/repositories/product.repository";
import { rowToProduct } from "@/lib/services/product.service";
import { resolveTransactionPrice } from "@/lib/services/pricing-authority";
import {
  InventoryService,
  type ValidateOrderStockResult,
} from "@/lib/services/inventory.service";
import {
  BITESHIP_API_BASE_URL,
  DEFAULT_COURIERS,
  extractWeightGrams,
  getBiteshipApiKey,
} from "@/lib/services/shipping/constants";
import { getDestinationCoords } from "@/lib/services/shipping/getRates";
import { computeFlatRateFallback } from "@/lib/services/shipping/flatRateFallback";
import { VoucherRepository } from "@/lib/repositories";
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
  stock: ValidateOrderStockResult;
  voucher?: {
    code: string;
    discount_percent: number;
    discount_amount: number;
  } | null;
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

interface RatesResult {
  pricing: RawBiteshipRate[];
  isFallback: boolean;
}

function flatRatePricing(
  province: string,
  city: string,
  weightGrams = 0,
): RawBiteshipRate[] {
  const fee = computeFlatRateFallback(province, city, weightGrams);
  return [
    {
      courier_code: fee.courier,
      courier_service_code: fee.service,
      price: fee.price,
    },
  ];
}

async function fetchBiteshipRates(params: {
  request: CreatePaymentRequest;
  items: ValidatedCheckoutItem[];
  totalWeightGrams: number;
}): Promise<RatesResult> {
  const { request, items, totalWeightGrams } = params;
  const address = request.shippingAddress;
  const areaId = address.areaId?.trim();

  const hasClientCoords =
    Number.isFinite(address.latitude) &&
    Number.isFinite(address.longitude) &&
    !!address.latitude &&
    !!address.longitude;
  const coords = hasClientCoords
    ? { lat: address.latitude!, lng: address.longitude! }
    : getDestinationCoords(address.city);

  // Jaring pengaman: area id & koordinat tidak ter-resolve → flat rate
  // deterministik (idem dengan nilai yang ditampilkan client).
  const fallback = (): RatesResult => ({
    pricing: flatRatePricing(address.province, address.city, totalWeightGrams),
    isFallback: true,
  });

  if (!areaId && !coords) {
    return fallback();
  }

  const apiKey = getBiteshipApiKey();
  const origin = {
    // Desa Pandantoyo, Kec. Temayang, Kab. Bojonegoro (lokasi toko)
    lat: Number(process.env.NEXT_PUBLIC_ORIGIN_LAT) || -7.32893,
    lng: Number(process.env.NEXT_PUBLIC_ORIGIN_LNG) || 111.92316,
  };

  const payload: Record<string, unknown> = {
    origin_latitude: origin.lat,
    origin_longitude: origin.lng,
    items: items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      value: item.product.price * item.quantity,
      weight: extractWeightGrams(item.product.weight),
    })),
    couriers: DEFAULT_COURIERS,
  };

  if (areaId) {
    payload.destination_area_id = areaId;
  } else {
    payload.destination_latitude = coords!.lat;
    payload.destination_longitude = coords!.lng;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BITESHIP_API_BASE_URL}/rates/couriers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = (await response.json()) as BiteshipRatesResponse;

    if (!response.ok) {
      console.error(
        "Biteship rates error:",
        response.status,
        body.message || body.error,
      );
      return fallback();
    }

    return {
      pricing: Array.isArray(body.pricing) ? body.pricing : [],
      isFallback: false,
    };
  } catch (error) {
    console.error("Biteship rates error:", error);
    return fallback();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function validateShippingFee(params: {
  request: CreatePaymentRequest;
  items: ValidatedCheckoutItem[];
}): Promise<number> {
  const { request, items } = params;
  // Berat total harus dikalkulasi dari source yang sama dengan yang
  // ditampilkan client (berat product di item keranjang), supaya fee
  // fallback deterministik dan cocok client ↔ server.
  const totalWeightGrams = items.reduce(
    (total, item) => total + extractWeightGrams(item.product.weight),
    0,
  );
  const { pricing: rates, isFallback } = await fetchBiteshipRates({
    request,
    items,
    totalWeightGrams,
  });
  const selectedCourier = normalizeText(request.shippingCourier);
  const selectedService = normalizeText(request.shippingService);

  if (isFallback) {
    // Rate fallback bersifat deterministik; pastikan metode yang dipilih
    // client sesuai dengan rate fallback yang disajikan.
    const fee = computeFlatRateFallback(
      request.shippingAddress.province,
      request.shippingAddress.city,
      totalWeightGrams,
    );
    if (selectedCourier !== fee.courier || selectedService !== fee.service) {
      throw new CheckoutValidationError("Metode pengiriman tidak valid.");
    }
    return fee.price;
  }

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

  const stockResult = await InventoryService.validateCheckoutStock(
    items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
    })),
  );

  const shippingFee = await validateShippingFee({ request: params, items });

  assertClientTotalsMatch(params, subtotal, shippingFee);

  // Voucher pre-validation (non-destructive). The authoritative check +
  // usage reservation happens atomically in the create route via
  // apply_voucher, but validating here gives an early, clear rejection
  // before any order row is written.
  let voucher: ValidatedCheckout["voucher"] = null;
  if (params.voucherCode && params.voucherCode.trim()) {
    const normalizedCode = params.voucherCode.trim().toUpperCase();
    try {
      const preview = await VoucherRepository.preview(normalizedCode, subtotal);
      voucher = {
        code: preview.code,
        discount_percent: preview.discount_percent,
        discount_amount: preview.discount_amount,
      };
    } catch {
      throw new CheckoutValidationError(
        "Kode voucher tidak valid",
        400,
      );
    }
  }

  const discountAmount = voucher?.discount_amount ?? 0;

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
    totalAmount: subtotal + shippingFee - discountAmount,
    stock: stockResult,
    voucher,
  };
}
