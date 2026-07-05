import { supabase } from "@/lib/supabase";
import type { ProductRow } from "@/types";

export async function findCatalog(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(image_url)")
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
