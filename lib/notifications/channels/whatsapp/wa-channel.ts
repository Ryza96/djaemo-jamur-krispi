import type { NotificationChannel, ChannelResult, NotificationPayload, RecipientInfo } from "../../types";
import type { WhatsAppProvider } from "./types";
import { formatWaMessage } from "./formatter";

export function createWhatsAppChannel(provider: WhatsAppProvider): NotificationChannel {
  return {
    channelId: "whatsapp",

    async send(
      payload: NotificationPayload,
      recipient: RecipientInfo,
    ): Promise<ChannelResult> {
      if (!recipient.phone) {
        return {
          success: false,
          channelId: "whatsapp",
          error: "NO_RECIPIENT_PHONE",
          timestamp: new Date().toISOString(),
        };
      }

      const message = formatWaMessage(payload);
      message.target = recipient.phone;

      const result = await provider.send(message);

      return {
        success: result.success,
        channelId: "whatsapp",
        messageId: result.messageId,
        error: result.error,
        timestamp: new Date().toISOString(),
      };
    },
  };
}
