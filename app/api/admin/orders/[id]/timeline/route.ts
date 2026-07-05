import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("Error fetching order timeline:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mengambil timeline pesanan." },
      { status: 500 },
    );
  }
}
