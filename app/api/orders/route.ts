import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer_id");
  const orderStatus = searchParams.get("status");

  try {
    let query = supabase.from("orders").select("*, order_items(*)");

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    if (orderStatus) {
      query = query.eq("status", orderStatus);
    }

    const { data: orders, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil data order." },
      { status: 500 }
    );
  }
}
