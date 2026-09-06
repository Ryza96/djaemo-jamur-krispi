import {
  calculateFlatRateShipping,
  type ShippingDestination,
  type ShippingService,
} from "@/lib/flatRateShipping";

export interface FallbackShippingFee {
  courier: string;
  service: string;
  price: number;
}

const PROVINCE_ZONE: Record<string, ShippingDestination> = {
  "DKI JAKARTA": "Jakarta",
  "JAWA BARAT": "Bandung",
  "JAWA TIMUR": "Surabaya",
};

function normalizeCity(value: string): string {
  return value
    .toLowerCase()
    .replace(/^(kab\.?|kota|kec\.?|kel\.?|prov\.?|prop\.?)\s*/, "")
    .replace(/[^a-z0-9]/g, "");
}

export function getFlatRateDestination(
  province: string,
  city: string,
): ShippingDestination {
  const zone = PROVINCE_ZONE[province.trim().toUpperCase()];
  if (zone) return zone;

  const cityKey = normalizeCity(city);
  if (cityKey.includes("jakarta")) return "Jakarta";
  if (cityKey.includes("bandung")) return "Bandung";
  if (cityKey.includes("surabaya")) return "Surabaya";

  return "Luar Jawa";
}

export function computeFlatRateFallback(
  province: string,
  city: string,
  weightGrams = 0,
): FallbackShippingFee {
  const destination = getFlatRateDestination(province, city);
  const service: ShippingService = "Reguler";
  const price = calculateFlatRateShipping(destination, service, weightGrams);
  return { courier: "jne", service: "reg", price };
}