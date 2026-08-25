import { supabase } from "@/lib/supabase";

export interface AuditLogParams {
  orderId: string;
  event: string;
  fromStatus: string | null;
  toStatus: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRow {
  id: number;
  order_id: string;
  event: string;
  from_status: string | null;
  to_status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const AuditLogRepository = {
  async insert(params: AuditLogParams): Promise<void> {
    const { error } = await supabase.from("audit_logs").insert({
      order_id: params.orderId,
      event: params.event,
      from_status: params.fromStatus,
      to_status: params.toStatus,
      metadata: params.metadata ?? null,
    });

    if (error) {
      console.error("Failed to write audit log:", error);
    }
  },

  /**
   * Returns all audit entries for an order in chronological order.
   * Used to derive derived state (e.g. manual-refund tracking) from the
   * append-only log instead of storing mutable flags on the order row.
   */
  async findByOrderId(orderId: string): Promise<AuditLogRow[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;
    return (data ?? []) as AuditLogRow[];
  },
};
