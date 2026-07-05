import { NextResponse, NextRequest } from "next/server";
import { OrderRepository } from "@/lib/repositories";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    let order = await OrderRepository.findDetailByOrderId(id);

    if (!order) {
      order = await OrderRepository.findDetailById(id);
    }

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order detail:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil detail pesanan." },
      { status: 500 },
    );
  }
}
