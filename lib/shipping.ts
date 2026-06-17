export type ShippingDestination = "Jakarta" | "Bandung" | "Surabaya" | "Luar Jawa";
export type ShippingService = "Reguler" | "Express" | "Economy";

export const services = [
  { label: "Reguler", multiplier: 1 },
  { label: "Express", multiplier: 1.4 },
  { label: "Economy", multiplier: 0.95 },
] as const;

const baseRates: Record<ShippingDestination, number> = {
  Jakarta: 15000,
  Bandung: 17000,
  Surabaya: 19000,
  "Luar Jawa": 25000,
};

export function parseWeight(weight: string) {
  return Number(weight.replace(/\D/g, "")) || 0;
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

export function calculateShippingFee(
  weightGrams: number,
  destination: ShippingDestination,
  service: ShippingService,
) {
  const baseRate = baseRates[destination] ?? baseRates["Luar Jawa"];
  const excessWeight = Math.max(0, weightGrams - 200);
  const extraCost = Math.ceil(excessWeight / 100) * 2000;
  const serviceMultiplier = services.find((item) => item.label === service)?.multiplier ?? 1;

  return Math.round((baseRate + extraCost) * serviceMultiplier);
}
