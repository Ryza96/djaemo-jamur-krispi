import { supabase } from "@/lib/supabase";
import type { VoucherRules } from "@/lib/services/voucher-engine";

export type VoucherRow = VoucherRules & {
  id: string;
  created_at: string;
  updated_at: string | null;
};

export interface CreateVoucherParams {
  code: string;
  name: string;
  discount_percent: number;
  min_purchase_amount: number;
  max_uses: number | null;
  valid_from: string;
  valid_until: string;
}

export interface AppliedVoucher {
  voucher_id: string;
  code: string;
  name: string;
  discount_percent: number;
  discount_amount: number;
  remaining_uses: number | null;
}

export const VoucherRepository = {
  async findAll(): Promise<VoucherRow[]> {
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async findById(id: string): Promise<VoucherRow | null> {
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async findByCode(code: string): Promise<VoucherRow | null> {
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(params: CreateVoucherParams): Promise<VoucherRow> {
    const { data, error } = await supabase
      .from("vouchers")
      .insert({
        code: params.code,
        name: params.name,
        discount_percent: params.discount_percent,
        min_purchase_amount: params.min_purchase_amount,
        max_uses: params.max_uses,
        valid_from: params.valid_from,
        valid_until: params.valid_until,
        is_active: true,
        current_uses: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(
    id: string,
    params: Omit<CreateVoucherParams, "code">,
  ): Promise<VoucherRow> {
    const { data, error } = await supabase
      .from("vouchers")
      .update({
        name: params.name,
        discount_percent: params.discount_percent,
        min_purchase_amount: params.min_purchase_amount,
        max_uses: params.max_uses,
        valid_from: params.valid_from,
        valid_until: params.valid_until,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from("vouchers")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Atomic reservation (TOCTOU-safe). The `apply_voucher` Postgres RPC
   * locks the voucher row, re-validates every rule, and increments
   * current_uses in the same transaction. Raises VOUCHER_* on rejection.
   */
  async applyAtomic(code: string, subtotal: number): Promise<AppliedVoucher> {
    const { data, error } = await supabase.rpc("apply_voucher", {
      p_code: code,
      p_subtotal: subtotal,
    });

    if (error) throw error;
    return data as AppliedVoucher;
  },

  /**
   * Non-destructive validation used by the real-time checkout endpoint.
   */
  async preview(code: string, subtotal: number): Promise<AppliedVoucher> {
    const { data, error } = await supabase.rpc("preview_voucher", {
      p_code: code,
      p_subtotal: subtotal,
    });

    if (error) throw error;
    return data as AppliedVoucher;
  },

  /**
   * Returns a reserved usage slot when an order is cancelled/expired/failed
   * before completion. The `release_voucher_usage` RPC is ATOMIC and
   * IDEMPOTENT: it serializes on the order row lock and uses the
   * `voucher_usage_released` flag so the slot is returned at most once per
   * order, safe against a webhook racing an admin cancel.
   */
  async releaseUsage(orderId: string): Promise<{ released: boolean; reason: string }> {
    const { data, error } = await supabase.rpc("release_voucher_usage", {
      p_order_id: orderId,
    });

    if (error) throw error;
    return data as { released: boolean; reason: string };
  },

  async deleteById(id: string): Promise<void> {
    const { error } = await supabase.from("vouchers").delete().eq("id", id);
    if (error) throw error;
  },
};
