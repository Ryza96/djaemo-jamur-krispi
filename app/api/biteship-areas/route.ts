/**
 * @deprecated Address lookups now use EMSIFA (lib/services/address/emsifa.ts).
 * This route was the Biteship-based provider for province/city/district search.
 * Kept for backward compatibility; callers should migrate to EMSIFA.
 */
import { NextResponse } from "next/server";
import { rankSearch } from "@/lib/utils/searchRanking";

const BITESHIP_MAPS_URL = "https://api.biteship.com/v1/maps/areas";
const API_TIMEOUT_MS = 8000;

const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY;

export const GET = async (request: Request) => {
  if (!BITESHIP_API_KEY) {
    return NextResponse.json(
      { error: "Biteship API key tidak dikonfigurasi." },
      { status: 500 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const level = searchParams.get("level") || "";

    const url = `${BITESHIP_MAPS_URL}?countries=ID&input=${encodeURIComponent(q)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${BITESHIP_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    let responseData: { areas?: Array<Record<string, unknown>> } | null = null;
    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = null;
      }
    }

    if (!response.ok || !responseData?.areas) {
      const apiError =
        responseData &&
        "error" in responseData &&
        typeof (responseData as Record<string, unknown>).error === "string"
          ? (responseData as Record<string, unknown>).error
          : `Gagal mengambil data area (${response.status})`;
      return NextResponse.json({ error: apiError }, { status: response.status || 502 });
    }

    const rawAreas = responseData.areas;

    const MAX_RESULTS = 8;

    async function fetchBiteship(input: string) {
      const url = `${BITESHIP_MAPS_URL}?countries=ID&input=${encodeURIComponent(input)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${BITESHIP_API_KEY}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        return (data?.areas as Array<Record<string, unknown>>) ?? [];
      } finally {
        clearTimeout(timeoutId);
      }
    }

    switch (level) {
      // Deprecated: Province search is now local (INDONESIA_PROVINCES).
      // Kept for backward compatibility only.
      case "province": {
        const seen = new Set<string>();
        function extractProvinces(areas: Array<Record<string, unknown>>) {
          const result: Array<{ name: string }> = [];
          for (const a of areas) {
            const name = a.administrative_division_level_1_name;
            const type = a.administrative_division_level_1_type;
            if (typeof name !== "string" || typeof type !== "string") continue;
            if (type !== "province" || seen.has(name)) continue;
            seen.add(name);
            result.push({ name });
          }
          return result;
        }

        let provinces = extractProvinces(rawAreas);

        if (q.length >= 4) {
          const fallback = await fetchBiteship(q.slice(0, 3));
          const extra = extractProvinces(fallback);
          provinces = provinces.concat(extra);
        }

        return NextResponse.json({
          success: true,
          areas: rankSearch(provinces, q, MAX_RESULTS),
        });
      }

      case "city": {
        const parent = searchParams.get("parent") || "";
        const seen = new Set<string>();
        const cities = rawAreas
          .filter((a) => {
            const parentName = a.administrative_division_level_1_name;
            const name = a.administrative_division_level_2_name;
            const type = a.administrative_division_level_2_type;
            if (typeof name !== "string" || typeof type !== "string" || typeof parentName !== "string") return false;
            if (type !== "city" || parentName !== parent || seen.has(name)) return false;
            seen.add(name);
            return true;
          })
          .map((a) => ({
            name: a.administrative_division_level_2_name as string,
          }));
        return NextResponse.json({ success: true, areas: rankSearch(cities, q, MAX_RESULTS) });
      }

      case "district": {
        const parent = searchParams.get("parent") || "";
        const seen = new Map<string, { postalCode: string; areaId: string }>();
        for (const a of rawAreas) {
          const cityName = a.administrative_division_level_2_name;
          const name = a.administrative_division_level_3_name;
          const type = a.administrative_division_level_3_type;
          if (typeof name !== "string" || typeof type !== "string" || typeof cityName !== "string") continue;
          if (type !== "district" || cityName !== parent) continue;

          const rawPostal = a.postal_code;
          const postalCode =
            typeof rawPostal === "number" && rawPostal > 0
              ? rawPostal.toString()
              : typeof rawPostal === "string" && rawPostal.length === 5
                ? rawPostal
                : "";
          const areaId = typeof a.id === "string" ? a.id : "";

          const existing = seen.get(name);
          if (!existing || (postalCode && !existing.postalCode)) {
            seen.set(name, { postalCode, areaId });
          }
        }
        const districts = Array.from(seen.entries())
          .map(([name, { postalCode, areaId }]) => ({
            name,
            postalCode,
            areaId,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        // District data is stable (no Biteship quirk), just limit to MAX_RESULTS
        return NextResponse.json({
          success: true,
          areas: districts.slice(0, MAX_RESULTS),
        });
      }

      default: {
        const seen = new Set<string>();
        const areas = rawAreas
          .filter((a) => {
            const name = a.administrative_division_level_3_name || a.administrative_division_level_2_name;
            if (typeof name !== "string" || seen.has(name)) return false;
            seen.add(name);
            return true;
          })
          .map((a) => ({
            name: (a.administrative_division_level_3_name || a.administrative_division_level_2_name) as string,
          }));
        return NextResponse.json({ success: true, areas: rankSearch(areas, q, MAX_RESULTS) });
      }
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Request timeout saat menghubungi Biteship."
        : error instanceof Error
          ? error.message
          : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
