import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/services/admin-auth.service";
import { supabase } from "@/lib/supabase";

const NOTIFICATION_LIMIT = 10;

export async function GET() {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { data: orders, error, count } = await supabase
      .from("orders")
      .select(
        "id, customer_name, customer_phone, total_amount, payment_status, fulfillment_status, created_at",
        { count: "exact" }
      )
      .eq("payment_status", "paid")
      .eq("fulfillment_status", "new")
      .order("created_at", { ascending: false })
      .limit(NOTIFICATION_LIMIT);

    if (error) throw error;

    return NextResponse.json({
      count: count ?? 0,
      orders: (orders ?? []).map((o) => ({
        id: o.id,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        total_amount: o.total_amount,
        created_at: o.created_at,
      })),
    });
  } catch (err) {
    console.error("[Admin Notifications]", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Gagal memuat notifikasi" },
      { status: 500 }
    );
  }
}
