import { websiteConfig } from '@repo/config';
import { serverEnv } from '@repo/env/server';
import type {
  MailProvider,
  SendEmailResult,
  SendRawEmailParams,
  SendTemplateParams,
} from './types';
import { Resend } from 'resend';

/**
 * Resend mail provider implementation
 *
 * docs:
 * https://example.com/docs/email
 */
export class ResendProvider implements MailProvider {
  private resend: Resend;
  private from: string;

  /**
   * Initialize Resend provider with API key
   */
  constructor() {
    if (!serverEnv.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set.');
    }

    if (!websiteConfig.mail.fromEmail) {
      throw new Error(
        'Default from email address is not set in websiteConfig.'
      );
    }

    const apiKey = serverEnv.RESEND_API_KEY;
    this.resend = new Resend(apiKey);
    this.from = websiteConfig.mail.fromEmail;
  }

  /**
   * Get the provider name
   * @returns Provider name
   */
  public getProviderName(): string {
    return 'resend';
  }

  /**
   * Send an email using a template
   *
   * Note: Template rendering is handled by the app layer.
   * This method should not be called directly - use sendRawEmail instead
   * after rendering the template.
   *
   * @param params Parameters for sending a templated email
   * @returns Send result
   */
  public async sendTemplate(
    params: SendTemplateParams
  ): Promise<SendEmailResult> {
    return {
      success: false,
      error:
        'sendTemplate is not supported in ResendProvider. Use sendRawEmail after rendering template.',
    };
  }

  /**
   * Send a raw email
   * @param params Parameters for sending a raw email
   * @returns Send result
   */
  public async sendRawEmail(
    params: SendRawEmailParams
  ): Promise<SendEmailResult> {
    const { to, subject, html, text } = params;

    if (!this.from || !to || !subject || !html) {
      console.warn('Missing required fields for email send', {
        from: this.from,
        to,
        subject,
        html,
      });
      return {
        success: false,
        error: 'Missing required fields',
      };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      if (error) {
        console.error('Error sending email', error);
        return {
          success: false,
          error,
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error,
      };
    }
  }
}
