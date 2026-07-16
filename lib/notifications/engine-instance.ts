import { createNotificationEngine } from "./notification-engine";
import { createChannelRegistry } from "./channel-registry";
import { createEmailChannel } from "./channels/email/email-channel";
import { createMockEmailProvider } from "./channels/email/mock-provider";
import { createWhatsAppChannel } from "./channels/whatsapp/wa-channel";
import { createFonnteProvider } from "./channels/whatsapp/fonnte-provider";

const registry = createChannelRegistry();
registry.register(createEmailChannel(createMockEmailProvider()));
registry.register(createWhatsAppChannel(createFonnteProvider(process.env.FONNTE_API_KEY ?? "")));
const engine = createNotificationEngine(registry);

export function getNotificationEngine() {
  return engine;
}
