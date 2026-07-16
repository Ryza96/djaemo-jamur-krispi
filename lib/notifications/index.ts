export { createNotificationEngine } from "./notification-engine";
export { createChannelRegistry } from "./channel-registry";
export { buildPayload } from "./payload-builder";
export type {
  NotificationEvent,
  NotificationChannel,
  NotificationPayload,
  ChannelResult,
  RecipientInfo,
} from "./types";

export { createEmailChannel, createMockEmailProvider, formatEmail, resolveTemplate } from "./channels/email";
export type { EmailMessage, EmailProvider, EmailSendResult, EmailTemplate } from "./channels/email";

export { createWhatsAppChannel, createFonnteProvider, createMockWhatsAppProvider, formatWaMessage } from "./channels/whatsapp";
export type { WhatsAppMessage, WhatsAppProvider, WhatsAppSendResult } from "./channels/whatsapp";
