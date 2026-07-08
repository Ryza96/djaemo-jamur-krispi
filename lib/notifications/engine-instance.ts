import { createNotificationEngine } from "./notification-engine";
import { createChannelRegistry } from "./channel-registry";
import { createEmailChannel } from "./channels/email/email-channel";
import { createMockEmailProvider } from "./channels/email/mock-provider";

const registry = createChannelRegistry();
registry.register(createEmailChannel(createMockEmailProvider()));
const engine = createNotificationEngine(registry);

export function getNotificationEngine() {
  return engine;
}
