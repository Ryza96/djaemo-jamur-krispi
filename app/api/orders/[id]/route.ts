import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

const TRACKING_FIELDS =
  "order_id, payment_status, fulfillment_status, total_amount, created_at, order_items(id, product_name, price, quantity, subtotal)";

const FULL_FIELDS =
  "id, order_id, payment_status, fulfillment_status, subtotal, shipping_fee, total_amount, destination, shipping_service, customer_phone, shipping_address, payment_method, created_at, access_token, order_items(id, product_name, price, quantity, subtotal), customers(name, email, phone)";

export async function GET(request: NextRequest, context: { params: any }) {
  const params = await context.params;
  const orderId = params.id;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  try {
    if (token) {
      const { data: order, error } = await supabase
        .from("orders")
        .select(FULL_FIELDS)
        .eq("order_id", orderId)
        .eq("access_token", token)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!order) {
        const { data: exists } = await supabase
          .from("orders")
          .select("id")
          .eq("order_id", orderId)
          .maybeSingle();

        if (exists) {
          return NextResponse.json({ error: "Token tidak valid." }, { status: 403 });
        }
        return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { access_token: _, ...safeOrder } = order;
      return NextResponse.json({ success: true, data: safeOrder });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select(TRACKING_FIELDS)
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil data order." },
      { status: 500 }
    );
  }
}
