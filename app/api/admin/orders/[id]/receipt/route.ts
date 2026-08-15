import { NextResponse } from "next/server";
import { ReceiptService } from "@/lib/services/shipping/receipt.service";
import { requireAdmin } from "@/lib/services/admin-auth.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const result = await ReceiptService.generateReceipt(id);

  if (!result.success) {
    if (result.error === "ORDER_NOT_FOUND") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(result.pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.filename}"`,
    },
  });
}
