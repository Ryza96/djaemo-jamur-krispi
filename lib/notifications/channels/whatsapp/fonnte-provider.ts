import type { WhatsAppProvider, WhatsAppMessage, WhatsAppSendResult } from "./types";

const FONNTE_API_URL = "https://api.fonnte.com/send";

export function createFonnteProvider(apiKey: string): WhatsAppProvider {
  return {
    providerId: "fonnte",

    async send(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
      try {
        const res = await fetch(FONNTE_API_URL, {
          method: "POST",
          headers: {
            Authorization: apiKey,
          },
          body: new URLSearchParams({
            target: message.target,
            message: message.message,
            type: "text",
          }),
        });

        const json = await res.json();

        if (!res.ok || json.status !== true) {
          return { success: false, error: json.reason ?? "FONNTE_API_ERROR" };
        }

        return {
          success: true,
          messageId: json.id ?? String(json.data?.message_id ?? ""),
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "NETWORK_ERROR",
        };
      }
    },
  };
}
