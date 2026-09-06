import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveBiteshipArea } from "@/lib/services/address/biteshipArea";

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
    return NextResponse.json({ success: true, ...area });
  } catch {
    return NextResponse.json({
      success: false,
      error: "Gagal melihat area pengiriman",
    });
  }
}