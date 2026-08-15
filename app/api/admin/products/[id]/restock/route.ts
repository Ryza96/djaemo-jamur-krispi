import { NextResponse, NextRequest } from "next/server";
import { InventoryService } from "@/lib/services/inventory.service";
import { MOVEMENT_REASON } from "@/lib/inventory/types";
import { restockSchema } from "@/lib/validation/admin-orders";
import { requireAdmin } from "@/lib/services/admin-auth.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body bukan JSON valid." }, { status: 400 });
    }

    const parsed = restockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data restock tidak valid.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { quantity } = parsed.data;

    let before;
    try {
      before = await InventoryService.getStock(id);
    } catch {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    try {
      await InventoryService.adjustProductStock({
        productId: id,
        delta: quantity,
        reason: MOVEMENT_REASON.MANUAL_ADJUST,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menambah stok.";
      if (message.includes("PRODUCT_NOT_FOUND")) {
        return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
      }
      return NextResponse.json({ error: message }, { status: 422 });
    }

    const after = await InventoryService.getStock(id);

    return NextResponse.json({
      success: true,
      productId: id,
      previousStock: before.currentStock,
      quantity,
      newStock: after.currentStock,
    });
  } catch (error) {
    console.error("Error restocking product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menambah stok." },
      { status: 500 },
    );
  }
}
