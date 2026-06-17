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
  "Luar Jawa": parseInt(process.env.SHIPPING_RATE_LUAR_JAWA || "25000"),
};

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
  service: ShippingService
): number {
  const baseRate = flatRates[destination] ?? flatRates["Luar Jawa"];
  const serviceMultiplier = services.find((item) => item.label === service)?.multiplier ?? 1;

  return Math.round(baseRate * serviceMultiplier);
}

export function getShippingRate(destination: ShippingDestination, service: ShippingService) {
  return {
    destination,
    service,
    fee: calculateFlatRateShipping(destination, service),
  };
}
