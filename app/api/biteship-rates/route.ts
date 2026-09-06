import { NextResponse } from "next/server";
import { computeFlatRateFallback } from "@/lib/services/shipping/flatRateFallback";

const BITESHIP_RATES_URL = "https://api.biteship.com/v1/rates/couriers";
const API_TIMEOUT_MS = 10000;

const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY;

interface RateSandbox {
  courier: string | null;
  service: string | null;
  price: number | null;
  etd: string | null;
}

interface IncomingItem {
  name?: unknown;
  quantity?: unknown;
  value?: unknown;
  weight?: unknown;
}

interface BiteshipPricingItem {
  courier_code?: unknown;
  courier?: unknown;
  company?: unknown;
  courier_service_code?: unknown;
  service?: unknown;
  courier_service_name?: unknown;
  price?: unknown;
  shipping_fee?: unknown;
  duration?: unknown;
  shipment_duration_range?: unknown;
}

function buildFallback(province: unknown, city: unknown) {
  const fee = computeFlatRateFallback(
    typeof province === "string" ? province : "",
    typeof city === "string" ? city : "",
  );
  const rates: RateSandbox[] = [
    { courier: fee.courier, service: fee.service, price: fee.price, etd: null },
  ];
  return NextResponse.json({ success: true, rates, isFallback: true });
}

export const POST = async (request: Request) => {
  try {
    const raw = await request.json();
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      return NextResponse.json(
        { error: "Request body bukan JSON object valid." },
        { status: 400 }
      );
    }

    const {
      origin_latitude,
      origin_longitude,
      origin_area_id,
      destination_latitude,
      destination_longitude,
      destination_area_id,
      items,
      couriers,
      province,
      city,
    } = raw as Record<string, unknown>;

    const hasOriginCoords =
      typeof origin_latitude === "number" && typeof origin_longitude === "number";
    const hasOriginArea =
      typeof origin_area_id === "string" && origin_area_id.trim().length > 0;
    const hasDestCoords =
      typeof destination_latitude === "number" &&
      typeof destination_longitude === "number";
    const hasDestArea =
      typeof destination_area_id === "string" && destination_area_id.trim().length > 0;

    const missingFields: string[] = [];
    if (!hasOriginCoords && !hasOriginArea) {
      missingFields.push("origin (latitude/longitude or area_id)");
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing or invalid fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    if (typeof couriers !== "string" || !couriers.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid field: couriers" },
        { status: 400 }
      );
    }

    // Tujuan tidak ter-resolve (tidak ada area id maupun koordinat) →
    // jaring pengaman flat rate supaya checkout tidak mentok.
    if (!hasDestArea && !hasDestCoords) {
      return buildFallback(province, city);
    }

    if (!BITESHIP_API_KEY) {
      console.error(
        "Biteship rates: BITESHIP_API_KEY tidak dikonfigurasi — memakai flat-rate fallback."
      );
      return buildFallback(province, city);
    }

    const courierList = couriers
      .split(",")
      .map((code: string) => code.trim())
      .filter(Boolean);

    if (courierList.length === 0) {
      return NextResponse.json(
        { error: "couriers must contain at least one courier code." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid field: items" },
        { status: 400 }
      );
    }

    const normalizedItems = items.map((item) => {
      const incoming = item as IncomingItem;
      return {
        name: String(incoming.name ?? "item"),
        quantity: Number(incoming.quantity ?? 1),
        value: Number(incoming.value ?? 0),
        weight: Number(incoming.weight ?? 0),
      };
    });

    const payload: Record<string, unknown> = {
      items: normalizedItems,
      couriers: courierList.join(","),
    };

    if (hasOriginArea) {
      payload.origin_area_id = (origin_area_id as string).trim();
    } else {
      payload.origin_latitude = origin_latitude;
      payload.origin_longitude = origin_longitude;
    }

    if (hasDestArea) {
      payload.destination_area_id = (destination_area_id as string).trim();
    } else {
      payload.destination_latitude = destination_latitude;
      payload.destination_longitude = destination_longitude;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(BITESHIP_RATES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BITESHIP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      console.error("Biteship rates error:", error);
      return buildFallback(province, city);
    } finally {
      clearTimeout(timeoutId);
    }

    const responseText = await response.text();
    let responseData: { pricing?: unknown } | null = null;
    if (responseText) {
      try {
        responseData = JSON.parse(responseText) as { pricing?: unknown };
      } catch {
        responseData = null;
      }
    }

    if (!response.ok || !responseData || !Array.isArray(responseData.pricing)) {
      console.error("Biteship rates error:", response.status, responseData);
      return buildFallback(province, city);
    }

    const pricing = responseData.pricing as BiteshipPricingItem[];

    const cleanedRates: RateSandbox[] = pricing.map((item) => ({
      courier: (item.courier_code ?? item.courier ?? item.company) as
        | string
        | null,
      service: (item.courier_service_code ??
        item.service ??
        item.courier_service_name) as string | null,
      price:
        typeof item.price === "number"
          ? item.price
          : Number(item.price ?? item.shipping_fee ?? 0),
      etd: (item.duration ?? item.shipment_duration_range) as string | null,
    }));

    return NextResponse.json({ success: true, rates: cleanedRates });
  } catch (error) {
    console.error("Biteship rates error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil ongkos kirim." },
      { status: 500 }
    );
  }
};