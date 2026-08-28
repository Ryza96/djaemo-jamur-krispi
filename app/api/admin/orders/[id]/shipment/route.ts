import { NextResponse, NextRequest } from "next/server";
import { OrderRepository } from "@/lib/repositories";
import { ShipmentService } from "@/lib/services/shipping/shipment.service";
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

    if (order.shipment_id) {
      return NextResponse.json({ error: "Shipment already exists." }, { status: 409 });
    }

    if (order.fulfillment_status !== "packing") {
      return NextResponse.json(
        { error: "Shipment can only be created for packing orders." },
        { status: 422 },
      );
    }

    if (order.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment must be completed before creating a shipment." },
        { status: 422 },
      );
    }

    const result = await ShipmentService.createShipment(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Gagal membuat shipment." }, { status: 422 });
    }

    const updatedOrder = await OrderRepository.findDetailByOrderId(id);
    const { access_token: _accessToken, ...safeOrder } = updatedOrder ?? {};

    return NextResponse.json({
      success: true,
      message: "Resi berhasil dibuat.",
      data: safeOrder,
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat shipment." },
      { status: 500 },
    );
  }
}
