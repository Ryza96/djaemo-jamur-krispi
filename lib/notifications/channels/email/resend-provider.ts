import type { EmailMessage, EmailProvider, EmailSendResult } from "./types";

const RESEND_API_URL = "https://api.resend.com/emails";

export function createResendProvider(apiKey: string): EmailProvider {
  return {
    providerId: "resend",

    async send(message: EmailMessage): Promise<EmailSendResult> {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });

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
    },
  };
}
