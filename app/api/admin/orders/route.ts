import { NextResponse } from "next/server";
import { OrderRepository } from "@/lib/repositories";
import { paginatedOrdersSchema } from "@/lib/validation/admin-orders";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = paginatedOrdersSchema.safeParse({
      search: searchParams.get("search") || undefined,
      payment_status: searchParams.get("payment_status") || undefined,
      fulfillment_status: searchParams.get("fulfillment_status") || undefined,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      sort: searchParams.get("sort") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parameter tidak valid", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await OrderRepository.getPaginated(parsed.data);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil daftar pesanan." },
      { status: 500 },
    );
  }
}
