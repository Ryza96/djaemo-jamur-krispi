import { supabase } from "@/lib/supabase";

export interface StockValidationResult {
  available: boolean;
  currentStock: number;
}

export const InventoryRepository = {
  async validateStock(
    productId: string,
    quantity: number,
  ): Promise<StockValidationResult> {
    const { data, error } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .maybeSingle();

    if (error || !data) throw new Error("PRODUCT_NOT_FOUND");

    return {
      available: data.stock >= quantity,
      currentStock: data.stock,
    };
  },

  async deductStock(productId: string, quantity: number): Promise<number> {
    const { data, error } = await supabase.rpc("deduct_product_stock", {
      p_product_id: productId,
      p_quantity: quantity,
    });

    if (error) throw error;
    return data as number;
  },

  async restoreStock(productId: string, quantity: number): Promise<number> {
    const { data, error } = await supabase.rpc("restore_product_stock", {
      p_product_id: productId,
      p_quantity: quantity,
    });

    if (error) throw error;
    return data as number;
  },

  async adjustStock(productId: string, delta: number): Promise<void> {
    if (delta === 0) throw new Error("INVALID_DELTA");

    if (delta > 0) {
      const { error } = await supabase.rpc("restore_product_stock", {
        p_product_id: productId,
        p_quantity: delta,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.rpc("deduct_product_stock", {
        p_product_id: productId,
        p_quantity: Math.abs(delta),
      });
      if (error) throw error;
    }
  },
};
