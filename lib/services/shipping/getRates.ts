import type { ShippingRate, ShippingAddress } from "@/types/checkout";
import type { CartItem } from "@/types";
import { mapBiteshipRates, type RawRate } from "./mapper";

interface GetRatesParams {
  address: ShippingAddress;
  items: CartItem[];
}

interface RatesResponse {
  rates: ShippingRate[];
  error?: string;
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  jakarta: { lat: -6.2088, lng: 106.8456 },
  "jakarta barat": { lat: -6.1676, lng: 106.7583 },
  "jakarta pusat": { lat: -6.1818, lng: 106.8223 },
  "jakarta selatan": { lat: -6.2615, lng: 106.8109 },
  "jakarta timur": { lat: -6.225, lng: 106.9005 },
  "jakarta utara": { lat: -6.1214, lng: 106.8741 },
  bandung: { lat: -6.9175, lng: 107.6191 },
  surabaya: { lat: -7.2575, lng: 112.7521 },
  semarang: { lat: -6.9932, lng: 110.4193 },
  yogyakarta: { lat: -7.7956, lng: 110.3695 },
  tangsel: { lat: -6.2889, lng: 106.7189 },
  "tangerang selatan": { lat: -6.2889, lng: 106.7189 },
  tangerang: { lat: -6.1781, lng: 106.63 },
  bekasi: { lat: -6.2349, lng: 106.9896 },
  depok: { lat: -6.4025, lng: 106.8025 },
  bogor: { lat: -6.5946, lng: 106.7893 },
  malang: { lat: -7.9666, lng: 112.6326 },
  solo: { lat: -7.5567, lng: 110.8317 },
  surakarta: { lat: -7.5567, lng: 110.8317 },
  medan: { lat: 3.5952, lng: 98.6722 },
  makassar: { lat: -5.1477, lng: 119.4322 },
  palembang: { lat: -2.9761, lng: 104.7754 },
  denpasar: { lat: -8.6705, lng: 115.2126 },
  bali: { lat: -8.3405, lng: 115.092 },
  pekanbaru: { lat: 0.5074, lng: 101.4478 },
  "bandar lampung": { lat: -5.429, lng: 105.263 },
  lampung: { lat: -5.429, lng: 105.263 },
  bojonegoro: { lat: -7.1545, lng: 111.8853 },
  samarinda: { lat: -0.4948, lng: 117.147 },
  batam: { lat: 1.1285, lng: 104.0441 },
  pontianak: { lat: -0.0263, lng: 109.3425 },
  banjarmasin: { lat: -3.3186, lng: 114.5944 },
  manado: { lat: 1.4908, lng: 124.8408 },
  padang: { lat: -0.9471, lng: 100.4172 },
  aceh: { lat: 5.5483, lng: 95.3238 },
  " banda aceh": { lat: 5.5483, lng: 95.3238 },
};

export function getDestinationCoords(
  city: string,
): { lat: number; lng: number } | null {
  const normalized = city.toLowerCase().trim();
  if (CITY_COORDS[normalized]) return CITY_COORDS[normalized];

  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }
  return null;
}

function getOriginCoords(): { lat: number; lng: number } {
  return {
    lat: Number(process.env.NEXT_PUBLIC_ORIGIN_LAT) || -7.1545,
    lng: Number(process.env.NEXT_PUBLIC_ORIGIN_LNG) || 111.8853,
  };
}

function extractWeight(product: { weight?: string }): number {
  return Number(product.weight?.replace(/[^0-9.]/g, "")) || 100;
}

const DEFAULT_COURIERS = "jne,jnt,sicepat,anteraja,idexpress";

export async function getRates(
  params: GetRatesParams,
  signal?: AbortSignal,
): Promise<RatesResponse> {
  const { address, items } = params;

  if (!address.city?.trim()) {
    return { rates: [], error: "Isi kota tujuan terlebih dahulu" };
  }

  const origin = getOriginCoords();
  const coords =
    address.latitude && address.longitude
      ? { lat: address.latitude, lng: address.longitude }
      : getDestinationCoords(address.city);

  if (!coords) {
    return {
      rates: [],
      error: `Kota "${address.city}" belum didukung. Hubungi kami untuk bantuan.`,
    };
  }

  try {
    const body: Record<string, unknown> = {
      origin_latitude: origin.lat,
      origin_longitude: origin.lng,
      destination_latitude: coords.lat,
      destination_longitude: coords.lng,
      items: items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        value: item.product.final_price * item.quantity,
        weight: extractWeight(item.product),
      })),
      couriers: DEFAULT_COURIERS,
    };

    const res = await fetch("/api/biteship-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    const data = await res.json();

    if (!res.ok) {
      return { rates: [], error: data.error || "Gagal mengambil tarif pengiriman" };
    }

    const raw: RawRate[] = data.rates ?? [];
    const rates = mapBiteshipRates(raw);

    if (rates.length === 0) {
      return {
        rates: [],
        error: "Tidak ada kurir tersedia untuk kota tujuan ini",
      };
    }

    return { rates };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Gagal terhubung ke server";
    return { rates: [], error: message };
  }
}
