import { supabase } from "@/lib/supabase";

export async function getProductLikeCount(productId: string): Promise<number> {
  const { count, error } = await supabase
    .from("product_likes")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (error) throw error;
  return count ?? 0;
}

export async function hasUserLiked(
  productId: string,
  deviceId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("product_likes")
    .select("id")
    .eq("product_id", productId)
    .eq("device_id", deviceId)
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function toggleProductLike(
  productId: string,
  deviceId: string
): Promise<{ count: number; liked: boolean }> {
  const existing = await supabase
    .from("product_likes")
    .select("id")
    .eq("product_id", productId)
    .eq("device_id", deviceId)
    .limit(1);

  if (existing.error) throw existing.error;

  if (existing.data && existing.data.length > 0) {
    const { error } = await supabase
      .from("product_likes")
      .delete()
      .eq("product_id", productId)
      .eq("device_id", deviceId);

    if (error) throw error;
  } else {
    const { error } = await supabase.from("product_likes").insert({
      product_id: productId,
      device_id: deviceId,
    });

    if (error) throw error;
  }

  const count = await getProductLikeCount(productId);
  const liked = !existing.data || existing.data.length === 0;
  return { count, liked };
}
