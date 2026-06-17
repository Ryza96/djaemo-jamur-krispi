import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest, context: { params: any }) {
  const params = await context.params;
  const orderId = params.id;

  try {
    // Try to fetch by order id first (UUID)
    let { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*), customers(*)")
      .eq("id", orderId)
      .single();

    // If not found, try by order_id (string identifier)
    if (error && error.code === "PGRST116") {
      ({ data: order, error } = await supabase
        .from("orders")
        .select("*, order_items(*), customers(*)")
        .eq("order_id", orderId)
        .single());
    }

    if (error) {
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

export async function PUT(request: NextRequest, context: { params: any }) {
  const params = await context.params;
  const orderId = params.id;
  const body = await request.json();
  const { status, payment_method, notes } = body;

  try {
    // Get order UUID first
    let { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .single();

    // If not found by UUID, try by order_id
    if (fetchError && fetchError.code === "PGRST116") {
      ({ data: order, error: fetchError } = await supabase
        .from("orders")
        .select("id")
        .eq("order_id", orderId)
        .single());
    }

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    // Update order
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (payment_method) updateData.payment_method = payment_method;
    if (notes !== undefined) updateData.notes = notes;

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order.id)
      .select("*, order_items(*), customers(*)")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengupdate order." },
      { status: 500 }
    );
  }
}
