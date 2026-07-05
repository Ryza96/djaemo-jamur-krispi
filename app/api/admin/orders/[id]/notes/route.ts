import { NextResponse, NextRequest } from "next/server";
import { OrderRepository } from "@/lib/repositories";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { adminNotesSchema } from "@/lib/validation/admin-orders";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
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

    const parsed = adminNotesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data catatan tidak valid.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { admin_notes } = parsed.data;

    await OrderRepository.updateAdminNotes(order.id, admin_notes);

    await AuditLogService.logPaymentEvent({
      orderId: id,
      event: AuditLogService.events.NOTES_UPDATED,
      fromStatus: null,
      toStatus: order.fulfillment_status ?? "unknown",
      metadata: { previous_notes: order.admin_notes },
    });

    const updatedOrder = await OrderRepository.findDetailByOrderId(id);

    return NextResponse.json({
      success: true,
      message: "Catatan berhasil diperbarui.",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order notes:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memperbarui catatan." },
      { status: 500 },
    );
  }
}
