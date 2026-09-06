import type { EmailMessage, EmailProvider, EmailSendResult } from "./types";
import { sendResendEmail } from "./resend-fetch";

export function createResendProvider(apiKey: string): EmailProvider {
  return {
    providerId: "resend",

    async send(message: EmailMessage): Promise<EmailSendResult> {
      const payload = {
        from: "noreply@mail.djaemo.com",
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      };

      try {
        const response = await sendResendEmail(payload, apiKey);
        const body = await response.json();

        if (!response.ok) {
          const errorMsg = body?.message || body?.error || `Resend API error ${response.status}`;
          console.error(`[Resend] FAILED: ${errorMsg}`);
          return {
            success: false,
            error: errorMsg,
          };
        }

        return {
          success: true,
          messageId: body.id,
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[Resend] FAILED: ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
        };
      }
    },
  };
}
