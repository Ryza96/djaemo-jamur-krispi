import { NextResponse } from "next/server";
import { PromoService } from "@/lib/services/promo.service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = await PromoService.cancelPromo(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/promos/[id]/cancel error:", error);
    return NextResponse.json(
      { error: "Gagal membatalkan promo" },
      { status: 500 }
    );
  }
}
