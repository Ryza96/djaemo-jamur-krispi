import type { NotificationChannel, ChannelResult, NotificationPayload, RecipientInfo } from "../../types";
import type { EmailProvider } from "./types";
import { formatEmail } from "./formatter";

export function createEmailChannel(provider: EmailProvider): NotificationChannel {
  return {
    channelId: "email",

    async send(
      payload: NotificationPayload,
      recipient: RecipientInfo,
    ): Promise<ChannelResult> {
      if (!recipient.email) {
        return {
          success: false,
          channelId: "email",
          error: "NO_RECIPIENT_EMAIL",
          timestamp: new Date().toISOString(),
        };
      }

      const message = formatEmail(payload);

      message.to = recipient.email;

      const result = await provider.send(message);

      return {
        success: result.success,
        channelId: "email",
        messageId: result.messageId,
        error: result.error,
        timestamp: new Date().toISOString(),
      };
    },
  };
}
