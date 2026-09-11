import { NextResponse } from "next/server";
import { findAllForAdmin } from "@/lib/repositories/product.repository";
import { rowToProduct } from "@/lib/services/product.service";
import { requireAdmin } from "@/lib/services/admin-auth.service";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const rows = await findAllForAdmin();
    return NextResponse.json(rows.map(rowToProduct));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to read products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}