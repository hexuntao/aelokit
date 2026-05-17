import { websiteConfig } from '@/config/website';
import { getMessagesForLocale } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import type { Locale, Messages } from 'next-intl';
import type { ReactElement } from 'react';
import { renderEmailHtml, toPlainText } from '@repo/mail';
import { ResendProvider } from './provider/resend';
import {
  type EmailTemplate,
  EmailTemplates,
  type MailProvider,
  type MailProviderName,
  type SendRawEmailParams,
  type SendTemplateParams,
} from './types';

type MailProviderFactory = () => MailProvider;

const providerRegistry: Partial<Record<MailProviderName, MailProviderFactory>> =
  {
    resend: () => new ResendProvider(),
  };

/**
 * Global mail provider instance
 */
let mailProvider: MailProvider | null = null;

/**
 * Get the mail provider
 * @returns current mail provider instance
 * @throws Error if provider is not initialized
 */
export const getMailProvider = (): MailProvider => {
  if (!mailProvider) mailProvider = createMailProvider();
  return mailProvider;
};

function createMailProvider(): MailProvider {
  const name = websiteConfig.mail.provider;
  if (!name) throw new Error('mail.provider is required in websiteConfig.');
  const factory = providerRegistry[name];
  if (!factory) throw new Error(`Unsupported mail provider: ${name}.`);
  return factory();
}

/**
 * Send email using the configured mail provider
 *
 * @param params Email parameters
 * @returns Success status
 */
export async function sendEmail(
  params: SendTemplateParams | SendRawEmailParams
) {
  if (!websiteConfig.mail?.enable) return false;
  const provider = getMailProvider();

  if ('template' in params) {
    const result = await provider.sendTemplate(params);
    return result.success;
  }
  const result = await provider.sendRawEmail(params);
  return result.success;
}

/**
 * Get rendered email for given template, context, and locale
 */
export async function getTemplate<T extends EmailTemplate>({
  template,
  context,
  locale = routing.defaultLocale,
}: {
  template: T;
  context: Record<string, any>;
  locale?: Locale;
}) {
  const mainTemplate = EmailTemplates[template];
  const messages = await getMessagesForLocale(locale);

  const email = mainTemplate({
    ...(context as any),
    locale,
    messages,
  });

  const subject =
    'subject' in messages.Mail[template as keyof Messages['Mail']]
      ? messages.Mail[template].subject
      : '';

  const html = await renderEmailHtml(email as ReactElement);
  const text = toPlainText(html);

  return { html, text, subject };
}
