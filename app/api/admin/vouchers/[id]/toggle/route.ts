import { NextResponse } from "next/server";
import { VoucherService } from "@/lib/services/voucher.service";
import { requireAdmin } from "@/lib/services/admin-auth.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    const body = await request.json();
    const isActive = Boolean(body.is_active);

    const result = await VoucherService.setActive(id, isActive);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/vouchers/[id]/toggle error:", error);
    return NextResponse.json(
      { error: "Gagal mengubah status voucher" },
      { status: 500 },
    );
  }
}
