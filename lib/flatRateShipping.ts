export type ShippingDestination = "Jakarta" | "Bandung" | "Surabaya" | "Luar Jawa";
export type ShippingService = "Reguler" | "Express" | "Economy";

export const services = [
  { label: "Reguler", multiplier: 1 },
  { label: "Express", multiplier: 1.4 },
  { label: "Economy", multiplier: 0.95 },
] as const;

const flatRates: Record<ShippingDestination, number> = {
  Jakarta: parseInt(process.env.SHIPPING_RATE_JAKARTA || "15000"),
  Bandung: parseInt(process.env.SHIPPING_RATE_BANDUNG || "17000"),
  Surabaya: parseInt(process.env.SHIPPING_RATE_SURABAYA || "19000"),
  "Luar Jawa": parseInt(process.env.SHIPPING_RATE_LUAR_JAWA || "55000"),
};

// Pendekatan konservatif mirip JNE: 1 kg pertama = 1x base rate,
// lalu naik 0.5x per penambahan 1 kg. Mencegah underpricing paket berat
// saat Biteship tidak dapat memberikan tarif riil.
function getWeightMultiplier(weightGrams: number): number {
  const safeWeight =
    Number.isFinite(weightGrams) && weightGrams > 0 ? weightGrams : 0;
  if (safeWeight <= 1000) return 1;
  if (safeWeight <= 2000) return 1.5;
  if (safeWeight <= 3000) return 2;
  return 2 + Math.ceil((safeWeight - 3000) / 1000) * 0.5;
}

export function parseDestinationFromAddress(address: string): ShippingDestination {
  const normalized = address.toLowerCase();

  if (normalized.includes("jakarta")) {
    return "Jakarta";
  }

  if (normalized.includes("bandung")) {
    return "Bandung";
  }

  if (normalized.includes("surabaya")) {
    return "Surabaya";
  }

  return "Luar Jawa";
}

export function calculateFlatRateShipping(
  destination: ShippingDestination,
  service: ShippingService,
  weightGrams = 0
): number {
  const baseRate = flatRates[destination] ?? flatRates["Luar Jawa"];
  const serviceMultiplier = services.find((item) => item.label === service)?.multiplier ?? 1;
  const weightMultiplier = getWeightMultiplier(weightGrams);

  return Math.round(baseRate * serviceMultiplier * weightMultiplier);
}

export function getShippingRate(
  destination: ShippingDestination,
  service: ShippingService,
  weightGrams = 0
) {
  return {
    destination,
    service,
    fee: calculateFlatRateShipping(destination, service, weightGrams),
  };
}
