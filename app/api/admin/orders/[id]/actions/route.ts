import { NextResponse, NextRequest } from "next/server";
import { OrderRepository } from "@/lib/repositories";
import { FulfillmentService } from "@/lib/services/fulfillment.service";
import { adminActionSchema } from "@/lib/validation/admin-orders";
import { requireAdmin } from "@/lib/services/admin-auth.service";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;

    const order = await OrderRepository.findByOrderId(id);
    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body bukan JSON valid." }, { status: 400 });
    }

    const parsed = adminActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data aksi tidak valid.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { action, waybill_id, cancellation_reason } = parsed.data;

    let result;
    switch (action) {
      case "confirm":
        result = await FulfillmentService.process(id);
        break;
      case "pack":
        result = await FulfillmentService.pack(id);
        break;
      case "ship":
        result = await FulfillmentService.ship(id, waybill_id);
        break;
      case "complete":
        result = await FulfillmentService.complete(id);
        break;
      case "cancel":
        result = await FulfillmentService.cancel(id, cancellation_reason);
        break;
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, previousStatus: result.previousStatus, newStatus: result.newStatus },
        { status: 422 },
      );
    }

    const updatedOrder = await OrderRepository.findDetailByOrderId(id);
    const { access_token: _accessToken, ...safeOrder } = updatedOrder ?? {};

    return NextResponse.json({
      success: true,
      message: result.message,
      data: safeOrder,
    });
  } catch (error) {
    console.error("Error executing order action:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengeksekusi aksi pesanan." },
      { status: 500 },
    );
  }
}
