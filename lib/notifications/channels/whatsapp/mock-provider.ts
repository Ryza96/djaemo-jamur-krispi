import type { WhatsAppProvider, WhatsAppMessage, WhatsAppSendResult } from "./types";

export function createMockWhatsAppProvider(): WhatsAppProvider {
  return {
    providerId: "mock",

    async send(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
      return {
        success: true,
        messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
    },
  };
}
