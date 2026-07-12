import { supabase } from "@/lib/supabase";
import type {
  StockInfo,
  StockValidationResult,
  DeductStockParams,
  RestoreStockParams,
  AdjustStockParams,
} from "@/lib/inventory/types";
import type { IInventoryRepository } from "@/lib/inventory/contracts";

interface RpcResult {
  movement_id: string;
  previous_stock: number;
  new_stock: number;
}

/**
 * Inventory repository for reading and writing product stock.
 *
 * - getStock / validateStock: direct SELECT on products table.
 * - deductStock / restoreStock / adjustStock: delegate to RPC functions.
 *
 * ADR-001 compliant:
 * - Parameter mapping (contract params -> RPC params)
 * - Calling RPC (supabase.rpc)
 * - Parsing JSONB (RPC result -> contract return type)
 * - Mapping results to contract
 */
export const InventoryRepository: IInventoryRepository = {
  async getStock(productId: string): Promise<StockInfo> {
    const { data, error } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .maybeSingle();

    if (error || !data) throw new Error("PRODUCT_NOT_FOUND");

    return {
      productId,
      currentStock: data.stock,
      // products table has no updated_at column.
      // TODO: return actual updated_at when column is added.
      updatedAt: new Date().toISOString(),
    };
  },

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

  async deductStock(params: DeductStockParams): Promise<number> {
    const { data, error } = await supabase.rpc("inventory_deduct", {
      p_product_id: params.productId,
      p_quantity: params.quantity,
      p_reason: params.reason,
      p_actor_type: params.actor ?? "system",
    });

    if (error) throw error;

    const result = data as RpcResult;
    return result.new_stock;
  },

  async restoreStock(params: RestoreStockParams): Promise<number> {
    const { data, error } = await supabase.rpc("inventory_restore", {
      p_product_id: params.productId,
      p_quantity: params.quantity,
      p_reason: params.reason,
      p_actor_type: params.actor ?? "system",
    });

    if (error) throw error;

    const result = data as RpcResult;
    return result.new_stock;
  },

  async adjustStock(params: AdjustStockParams): Promise<void> {
    if (params.delta === 0) throw new Error("INVALID_DELTA");

    const { error } = await supabase.rpc("inventory_adjust", {
      p_product_id: params.productId,
      p_quantity: params.delta,
      p_reason: params.reason,
      p_actor_type: "admin",
      p_actor_id: params.adminId ?? null,
    });

    if (error) throw error;
  },
};
