import type { MailConfig } from '@repo/config';

/** Mail provider name from website config */
export type MailProviderName = NonNullable<MailConfig['provider']>;

/**
 * Locale type - generic string type
 * App layer should provide actual locale values
 */
export type Locale = string;

/**
 * Messages type - generic record
 * App layer should provide actual messages structure
 */
export type Messages = Record<string, any>;

/**
 * Base email component props
 */
export interface BaseEmailProps {
  locale: Locale;
  messages: Messages;
}

/**
 * Common email sending parameters
 */
export interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html: string;
  from?: string;
}

/**
 * Result of sending an email
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: any;
}

/**
 * Parameters for sending a raw email
 */
export interface SendRawEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  locale?: Locale;
}

/**
 * Mail provider interface
 */
export interface MailProvider {
  /**
   * Send an email using a template
   */
  sendTemplate(params: SendTemplateParams): Promise<SendEmailResult>;

  /**
   * Send a raw email
   */
  sendRawEmail(params: SendRawEmailParams): Promise<SendEmailResult>;

  /**
   * Get the provider's name
   */
  getProviderName(): string;
}

/**
 * Email template function type
 */
export type EmailTemplateFn<T = Record<string, any>> = (
  props: T & BaseEmailProps
) => React.ReactNode;

/**
 * Rendered email result
 */
export interface RenderedEmail {
  html: string;
  text: string;
  subject: string;
}

/**
 * Parameters for template rendering
 */
export interface RenderTemplateParams {
  template: React.ReactNode;
}

/**
 * Parameters for sending an email using a template
 * Note: The template type and context are defined by the app layer
 */
export interface SendTemplateParams {
  to: string;
  template: string;
  context: Record<string, any>;
  locale?: Locale;
}
