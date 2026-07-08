import { buildPayload } from "./payload-builder";
import { NotificationLogRepository } from "@/lib/repositories";
import type { ChannelRegistry } from "./channel-registry";
import type { ChannelResult, NotificationEvent } from "./types";

export function createNotificationEngine(registry: ChannelRegistry) {
  return {
    notify(event: NotificationEvent, orderId: string): void {
      this.dispatch(event, orderId).catch(() => {});
    },

    async dispatch(
      event: NotificationEvent,
      orderId: string,
    ): Promise<ChannelResult[]> {
      const payload = await buildPayload(event, orderId);
      if (!payload) return [];

      const channels = registry.getAll();
      const recipient = payload.customer;

      const results = await Promise.allSettled(
        channels.map(async (ch) => {
          if (
            await NotificationLogRepository.isSent(event, orderId, ch.channelId)
          ) {
            return {
              success: true,
              channelId: ch.channelId,
              skipped: true,
              timestamp: new Date().toISOString(),
            };
          }

          const logId = await NotificationLogRepository.insertPending(
            event,
            orderId,
            ch.channelId,
          );

          const result = await ch.send(payload, recipient);

          if (result.success) {
            await NotificationLogRepository.tryMarkSent(logId);
          } else {
            await NotificationLogRepository.markFailed(logId);
          }

          return result;
        }),
      );

      return results.map((r, i) => {
        if (r.status === "fulfilled") return r.value;
        return {
          success: false,
          channelId: channels[i].channelId,
          error: r.reason instanceof Error ? r.reason.message : "UNKNOWN_ERROR",
          timestamp: new Date().toISOString(),
        };
      });
    },
  };
}

export type NotificationEngine = ReturnType<typeof createNotificationEngine>;
