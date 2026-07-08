import type { EmailMessage, EmailProvider, EmailSendResult } from "./types";

export function createMockEmailProvider(): EmailProvider {
  return {
    providerId: "mock",

    async send(message: EmailMessage): Promise<EmailSendResult> {
      return {
        success: true,
        messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
    },
  };
}
