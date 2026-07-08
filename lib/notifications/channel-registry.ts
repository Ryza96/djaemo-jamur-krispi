import type { NotificationChannel } from "./types";

export function createChannelRegistry() {
  const channels = new Map<string, NotificationChannel>();

  return {
    register(channel: NotificationChannel): void {
      channels.set(channel.channelId, channel);
    },

    unregister(channelId: string): void {
      channels.delete(channelId);
    },

    get(channelId: string): NotificationChannel | undefined {
      return channels.get(channelId);
    },

    getAll(): NotificationChannel[] {
      return Array.from(channels.values());
    },
  };
}

export type ChannelRegistry = ReturnType<typeof createChannelRegistry>;
