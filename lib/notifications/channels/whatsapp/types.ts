export interface WhatsAppMessage {
  target: string;
  message: string;
}

export interface WhatsAppProvider {
  readonly providerId: string;
  send(message: WhatsAppMessage): Promise<WhatsAppSendResult>;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
