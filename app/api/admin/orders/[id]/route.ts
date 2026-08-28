import { NextResponse, NextRequest } from "next/server";
import { OrderRepository } from "@/lib/repositories";
import { OrderService } from "@/lib/services/order.service";
import { requireAdmin } from "@/lib/services/admin-auth.service";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;

    let order = await OrderRepository.findDetailByOrderId(id);

    if (!order) {
      order = await OrderRepository.findDetailById(id);
    }

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    const refundInfo = await OrderService.getRefundInfo(id);

    const { access_token: _accessToken, ...safeOrder } = order;

    return NextResponse.json({ success: true, data: { ...safeOrder, refund_info: refundInfo } });
  } catch (error) {
    console.error("Error fetching order detail:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil detail pesanan." },
      { status: 500 },
    );
  }
}
