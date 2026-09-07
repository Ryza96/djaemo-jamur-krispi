const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const NOMINATIM_TIMEOUT_MS = 6000;

// OpenStreetMap Nominatim usage policy: maks. 1 request/detik.
const NOMINATIM_MIN_INTERVAL_MS = 1100;

// User-Agent wajib mengidentifikasi aplikasi (usage policy Nominatim).
const NOMINATIM_USER_AGENT = "DjaemoJamurKrispi/1.0 (info@jamurkrispi.com)";

const PREFERRED_TYPES = new Set([
  "administrative",
  "suburb",
  "town",
  "village",
  "hamlet",
  "city",
  "county",
  "municipality",
]);

export interface GeocodingResult {
  lat: number;
  lng: number;
}

export interface GeocodeAreaInput {
  province?: string;
  city: string;
  district?: string;
}

interface NominatimPlace {
  lat?: string;
  lon?: string;
  type?: string;
}

const cache = new Map<string, GeocodingResult>();

function normalizeKey(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cacheKey(input: GeocodeAreaInput): string {
  return [input.province, input.city, input.district]
    .map(normalizeKey)
    .join("|");
}

let nextAllowedAt = 0;

async function throttleNominatim(): Promise<void> {
  const waitMs = nextAllowedAt - Date.now();
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  nextAllowedAt = Date.now() + NOMINATIM_MIN_INTERVAL_MS;
}

async function searchStructured(
  params: Record<string, string>,
): Promise<NominatimPlace[]> {
  await throttleNominatim();

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "3");
  url.searchParams.set("country", "Indonesia");
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": NOMINATIM_USER_AGENT,
        "Accept-Language": "id",
      },
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const data = (await response.json()) as unknown;
    return Array.isArray(data) ? (data as NominatimPlace[]) : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

function pickPlace(places: NominatimPlace[]): NominatimPlace | null {
  return (
    places.find((place) => place.type && PREFERRED_TYPES.has(place.type)) ??
    places[0] ??
    null
  );
}

function toResult(place: NominatimPlace | null): GeocodingResult | null {
  if (!place?.lat || !place?.lon) return null;
  const lat = Number(place.lat);
  const lng = Number(place.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
    ? { lat, lng }
    : null;
}

export async function geocodeAddress(
  input: GeocodeAreaInput,
): Promise<GeocodingResult | null> {
  const key = cacheKey(input);
  const cached = cache.get(key);
  if (cached) return cached;

  const attempts: Array<Record<string, string>> = [];
  if (input.district) {
    attempts.push({
      state: input.province ?? "",
      county: input.city,
      city: input.district,
    });
  }
  attempts.push({ state: input.province ?? "", county: input.city });

  for (const attempt of attempts) {
    const result = toResult(pickPlace(await searchStructured(attempt)));
    if (result) {
      cache.set(key, result);
      return result;
    }
  }
  return null;
}