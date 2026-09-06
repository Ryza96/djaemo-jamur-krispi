import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

const TRACKING_FIELDS =
  "order_id, payment_status, fulfillment_status, total_amount, created_at, order_items(id, product_name, price, quantity, subtotal)";

const FULL_FIELDS =
  "id, order_id, payment_status, fulfillment_status, subtotal, shipping_fee, total_amount, destination, shipping_service, customer_name, customer_email, customer_phone, shipping_address, shipping_cost, courier_company, courier_type, postal_code, destination_area_id, notes, payment_method, transaction_id, created_at, waybill_id, tracking_url, access_token, order_items(id, product_name, price, quantity, subtotal), customers(name, email, phone)";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const orderId = params.id;
  const token = request.headers.get("X-Order-Token");

  try {
    if (token) {
      const { data: order, error } = await supabase
        .from("orders")
        .select(FULL_FIELDS)
        .eq("order_id", orderId)
        .eq("access_token", token)
        .maybeSingle();

      if (error) {
        console.error("Error fetching order with token:", error);
        return NextResponse.json({ error: "Terjadi kesalahan server. Silakan coba lagi." }, { status: 500 });
      }

      if (order) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { access_token: _, ...safeOrder } = order;
        return NextResponse.json({ success: true, data: safeOrder });
      }

      // Token provided but did NOT match this order: fall back to the same
      // public result as a no-token request. Returning a distinct
      // 403/404 here would leak whether the order ID exists (a customer
      // could enumerate orders and tell "wrong token" apart from "no such
      // order"). Falling through to the tracking query hides that.
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select(TRACKING_FIELDS)
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching order tracking:", error);
      return NextResponse.json({ error: "Terjadi kesalahan server. Silakan coba lagi." }, { status: 500 });
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
