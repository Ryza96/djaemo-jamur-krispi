export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  readonly providerId: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTemplate {
  subject: string;
  headerHtml: string;
  plainTextIntro: string;
}
