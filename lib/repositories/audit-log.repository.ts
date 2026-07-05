import { supabase } from "@/lib/supabase";

export interface AuditLogParams {
  orderId: string;
  event: string;
  fromStatus: string | null;
  toStatus: string;
  metadata?: Record<string, unknown>;
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
};
