import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveBiteshipArea } from "@/lib/services/address/biteshipArea";
import { geocodeAddress } from "@/lib/services/address/geocoding";

const resolveAreaSchema = z.object({
  province: z.string().optional(),
  city: z.string().min(1, "city wajib diisi"),
  district: z.string().min(1, "district wajib diisi"),
  kelurahan: z.string().optional(),
  postalCode: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body bukan JSON valid" },
      { status: 400 },
    );
  }

  const parsed = resolveAreaSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Data area tidak valid";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  try {
    const area = await resolveBiteshipArea(parsed.data);
    if (!area || !area.areaId) {
      return NextResponse.json({
        success: false,
        message: "Area tidak dapat di-resolve",
      });
    }

    const body: Record<string, unknown> = {
      success: true,
      areaId: area.areaId,
      postalCode: area.postalCode,
    };

    if (area.latitude && area.longitude) {
      body.latitude = area.latitude;
      body.longitude = area.longitude;
    } else {
      const coords = await geocodeAddress(parsed.data);
      if (coords) {
        body.latitude = coords.lat;
        body.longitude = coords.lng;
      }
    }

    return NextResponse.json(body);
  } catch {
    return NextResponse.json({
      success: false,
      error: "Gagal melihat area pengiriman",
    });
  }
}