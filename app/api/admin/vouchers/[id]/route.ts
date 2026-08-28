import { NextResponse } from "next/server";
import { VoucherService } from "@/lib/services/voucher.service";
import { requireAdmin } from "@/lib/services/admin-auth.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    const voucher = await VoucherService.getById(id);

    if (!voucher) {
      return NextResponse.json({ error: "Voucher tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: voucher });
  } catch (error) {
    console.error("GET /api/admin/vouchers/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat voucher" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    const body = await request.json();

    const result = await VoucherService.update(id, {
      name: body.name,
      discount_percent: body.discount_percent,
      min_purchase_amount: body.min_purchase_amount,
      max_uses: body.max_uses,
      valid_from: body.valid_from,
      valid_until: body.valid_until,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("PATCH /api/admin/vouchers/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui voucher" },
      { status: 500 },
    );
  }
}
