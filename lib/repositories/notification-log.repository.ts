import { supabase } from "@/lib/supabase";

export const NotificationLogRepository = {
  async isSent(
    event: string,
    orderId: string,
    channelId: string,
  ): Promise<boolean> {
    const { data } = await supabase
      .from("notification_log")
      .select("id")
      .eq("event", event)
      .eq("order_id", orderId)
      .eq("channel_id", channelId)
      .eq("status", "sent")
      .maybeSingle();

    return !!data;
  },

  async insertPending(
    event: string,
    orderId: string,
    channelId: string,
  ): Promise<string> {
    const { data, error } = await supabase
      .from("notification_log")
      .insert({
        event,
        order_id: orderId,
        channel_id: channelId,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  },

  async tryMarkSent(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("notification_log")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) return true;

    if (error.code === "23505") return false;

    console.error("NotificationLogRepository.tryMarkSent error:", error);
    return false;
  },

  async markFailed(id: string): Promise<void> {
    await supabase
      .from("notification_log")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", id);
  },
};
