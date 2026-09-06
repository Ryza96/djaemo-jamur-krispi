import {
  BITESHIP_API_BASE_URL,
  getBiteshipApiKey,
} from "@/lib/services/shipping/constants";

const API_TIMEOUT_MS = 8000;

export interface BiteshipArea {
  areaId: string;
  postalCode: string | null;
  latitude?: number;
  longitude?: number;
}

export interface ResolveAreaParams {
  province?: string;
  city: string;
  district: string;
  kelurahan?: string;
  postalCode?: string;
}

interface RawArea {
  id?: unknown;
  postal_code?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  administrative_division_level_2_name?: unknown;
  administrative_division_level_2_type?: unknown;
  administrative_division_level_3_name?: unknown;
  administrative_division_level_3_type?: unknown;
  administrative_division_level_4_name?: unknown;
  administrative_division_level_4_type?: unknown;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/^(kab\.?|kota|kec\.?|kel\.?|prov\.?|prop\.?)\s*/, "")
    .replace(/[^a-z0-9]/g, "");
}

function isSameName(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  return na === nb || (na.length >= 4 && (na.includes(nb) || nb.includes(na)));
}

function matchesCity(cityName: string, city: string): boolean {
  const key = normalizeName(city);
  if (!key) return true;
  const name = normalizeName(cityName);
  return name.includes(key) || key.includes(name);
}

function parsePostalCode(raw: unknown): string | null {
  if (typeof raw === "number" && raw > 0) return raw.toString();
  if (typeof raw === "string" && /^[0-9]{5}$/.test(raw)) return raw;
  return null;
}

function toArea(a: RawArea): BiteshipArea {
  return {
    areaId: typeof a.id === "string" ? a.id : "",
    postalCode: parsePostalCode(a.postal_code),
    latitude: typeof a.latitude === "number" ? a.latitude : undefined,
    longitude: typeof a.longitude === "number" ? a.longitude : undefined,
  };
}

function isDistrictArea(a: RawArea): boolean {
  return a.administrative_division_level_3_type === "district";
}

function isSubdistrictArea(a: RawArea): boolean {
  return a.administrative_division_level_4_type === "subdistrict";
}

function districtMatches(a: RawArea, params: ResolveAreaParams): boolean {
  if (!isDistrictArea(a)) return false;
  if (!matchesCity(String(a.administrative_division_level_2_name ?? ""), params.city)) return false;
  return isSameName(String(a.administrative_division_level_3_name ?? ""), params.district);
}

function subdistrictMatches(a: RawArea, params: ResolveAreaParams): boolean {
  if (!isSubdistrictArea(a)) return false;
  if (!matchesCity(String(a.administrative_division_level_2_name ?? ""), params.city)) return false;
  if (!isSameName(String(a.administrative_division_level_3_name ?? ""), params.district)) return false;
  if (!params.kelurahan) return false;
  return isSameName(String(a.administrative_division_level_4_name ?? ""), params.kelurahan);
}

async function searchAreas(
  input: string,
  signal?: AbortSignal,
): Promise<RawArea[]> {
  const url = `${BITESHIP_API_BASE_URL}/maps/areas?countries=ID&input=${encodeURIComponent(input)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getBiteshipApiKey()}`,
      "Content-Type": "application/json",
    },
    signal,
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { areas?: RawArea[] };
  return Array.isArray(data.areas) ? data.areas : [];
}

export async function resolveBiteshipArea(
  params: ResolveAreaParams,
): Promise<BiteshipArea | null> {
  const queries = [params.district, `${params.district} ${params.city}`, params.city]
    .filter((q) => q && q.trim().length >= 3);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    for (const query of queries) {
      let areas: RawArea[] = [];
      try {
        areas = await searchAreas(query, controller.signal);
      } catch {
        return null;
      }
      if (areas.length === 0) continue;

      const districtMatchesList = areas.filter((a) => districtMatches(a, params));

      if (params.postalCode) {
        const withPostal = districtMatchesList.find(
          (a) => parsePostalCode(a.postal_code) === params.postalCode,
        );
        if (withPostal) return toArea(withPostal);
      }
      if (districtMatchesList.length > 0) {
        return toArea(districtMatchesList[0]);
      }

      const subdistrict = areas.find((a) => subdistrictMatches(a, params));
      if (subdistrict) return toArea(subdistrict);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}