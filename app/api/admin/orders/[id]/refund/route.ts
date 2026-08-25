import { NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order.service";
import { requireAdmin } from "@/lib/services/admin-auth.service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;

    const result = await OrderService.confirmManualRefund(id);

    if (!result.success) {
      if (result.message === "ORDER_NOT_FOUND") {
        return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
      }
      return NextResponse.json({ error: result.message }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.refundInfo,
    });
  } catch (error) {
    console.error("Error confirming manual refund:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menandai refund." },
      { status: 500 },
    );
  }
}
