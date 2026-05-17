import { getTemplate } from '@/mail';
import type {
  MailProvider,
  SendEmailResult,
  SendRawEmailParams,
  SendTemplateParams,
} from '@/mail/types';
import { ResendProvider as BaseResendProvider } from '@repo/mail';

/**
 * Resend mail provider implementation
 *
 * docs:
 * https://example.com/docs/email
 */
export class ResendProvider implements MailProvider {
  private baseProvider: BaseResendProvider;

  /**
   * Initialize Resend provider with API key
   */
  constructor() {
    this.baseProvider = new BaseResendProvider();
  }

  /**
   * Get the provider name
   * @returns Provider name
   */
  public getProviderName(): string {
    return this.baseProvider.getProviderName();
  }

  /**
   * Send an email using a template
   * @param params Parameters for sending a templated email
   * @returns Send result
   */
  public async sendTemplate(
    params: SendTemplateParams
  ): Promise<SendEmailResult> {
    const { to, template, context, locale } = params;

    try {
      const mailTemplate = await getTemplate({
        template,
        context,
        locale,
      });

      return this.sendRawEmail({
        to,
        subject: mailTemplate.subject,
        html: mailTemplate.html,
        text: mailTemplate.text,
      });
    } catch (error) {
      console.error('Error sending template email:', error);
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Send a raw email
   * @param params Parameters for sending a raw email
   * @returns Send result
   */
  public async sendRawEmail(
    params: SendRawEmailParams
  ): Promise<SendEmailResult> {
    return this.baseProvider.sendRawEmail(params);
  }
}
