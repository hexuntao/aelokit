import { websiteConfig } from '@repo/config';
import { BeehiivNewsletterProvider } from './providers/beehiiv';
import { ResendNewsletterProvider } from './providers/resend';
import type { NewsletterProvider, NewsletterProviderName } from './types';

type NewsletterProviderFactory = () => NewsletterProvider;

const providerRegistry: Partial<
  Record<NewsletterProviderName, NewsletterProviderFactory>
> = {
  resend: () => new ResendNewsletterProvider(),
  beehiiv: () => new BeehiivNewsletterProvider(),
};

let newsletterProvider: NewsletterProvider | null = null;

function createNewsletterProvider(): NewsletterProvider {
  const name = websiteConfig.newsletter.provider;
  if (!name)
    throw new Error('newsletter.provider is required in websiteConfig.');
  const factory = providerRegistry[name];
  if (!factory) throw new Error(`Unsupported newsletter provider: ${name}.`);
  return factory();
}

/**
 * Get the newsletter provider
 * @returns current newsletter provider instance
 */
export const getNewsletterProvider = (): NewsletterProvider => {
  if (!newsletterProvider) newsletterProvider = createNewsletterProvider();
  return newsletterProvider;
};
