import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/admin-auth.service";
import { PartnerService } from "@/lib/services/partner.service";

// See approve/route.ts — no per-admin identity exists in the session
// payload, so reviews are recorded with the literal "admin".
const REVIEWED_BY = "admin";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    const result = await PartnerService.reject(id, REVIEWED_BY);

    if (!result.success) {
      const status = result.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("POST /api/admin/partners/[id]/reject error:", error);
    return NextResponse.json(
      { error: "Gagal menolak partner" },
      { status: 500 },
    );
  }
}
