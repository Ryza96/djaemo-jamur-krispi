import { supabase } from "@/lib/supabase";
import type { ProductRow } from "@/types";

export async function findCatalog(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(image_url)")
    .gt("stock", 0)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function findById(id: string): Promise<ProductRow | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(image_url)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface SoldQuantityRow {
  product_id: string;
  total_quantity: number;
}

export async function findSoldQuantities(): Promise<SoldQuantityRow[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select("product_id, quantity, orders!inner(payment_status)")
    .eq("orders.payment_status", "paid")
    .not("product_id", "is", null);

  if (error) throw error;

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const pid = row.product_id as string | null;
    if (!pid) continue;
    totals.set(pid, (totals.get(pid) ?? 0) + (row.quantity as number));
  }

  return [...totals.entries()].map(([product_id, total_quantity]) => ({
    product_id,
    total_quantity,
  }));
}
