import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { OrderService } from "@/lib/services/order.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const orderId = params.id;
  const token = request.headers.get("X-Order-Token");

  if (!token) {
    return NextResponse.json(
      { error: "Token wajib diisi." },
      { status: 400 }
    );
  }

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select("id")
      .eq("order_id", orderId)
      .eq("access_token", token)
      .maybeSingle();

    if (error) {
      console.error("Error verifying order token:", error);
      return NextResponse.json({ error: "Terjadi kesalahan server. Silakan coba lagi." }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: "Token tidak valid." }, { status: 403 });
    }

    const result = await OrderService.expireUnpaidOrder(orderId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: result.message === "ORDER_NOT_FOUND" ? 404 : 409 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      message: result.message,
    });
  } catch (error) {
    console.error("POST /api/orders/[id]/expire error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengakhiri pesanan."
      },
      { status: 500 }
    );
  }
}
