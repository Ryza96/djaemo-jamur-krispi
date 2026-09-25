import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/admin-auth.service";
import {
  PARTNER_STATUSES,
  PartnerService,
  type PartnerStatus,
} from "@/lib/services/partner.service";

export async function GET(request: Request) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const statusParam = new URL(request.url).searchParams.get("status");

    let status: PartnerStatus | undefined;
    if (statusParam) {
      if (!(PARTNER_STATUSES as readonly string[]).includes(statusParam)) {
        return NextResponse.json(
          { error: "Filter status tidak valid" },
          { status: 400 },
        );
      }
      status = statusParam as PartnerStatus;
    }

    const partners = await PartnerService.list(status);
    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    console.error("GET /api/admin/partners error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data partner" },
      { status: 500 },
    );
  }
}
