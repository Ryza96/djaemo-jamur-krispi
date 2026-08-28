import { NextResponse } from "next/server";
import { VoucherService } from "@/lib/services/voucher.service";
import { requireAdmin } from "@/lib/services/admin-auth.service";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as Record<string, unknown>).message);
  }
  return "Terjadi kesalahan";
}

export async function GET() {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const vouchers = await VoucherService.getAll();
    return NextResponse.json({ success: true, data: vouchers });
  } catch (error) {
    console.error("GET /api/admin/vouchers error:", error);
    return NextResponse.json({ error: "Gagal memuat data voucher" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const body = await request.json();
    const result = await VoucherService.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/vouchers error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
