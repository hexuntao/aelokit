import type { MailProvider } from './types';

/**
 * Mail provider registry type
 */
export type MailProviderFactory = () => MailProvider;

/**
 * Create a mail provider from registry
 */
export function createMailProvider(
  name: string,
  registry: Record<string, MailProviderFactory>
): MailProvider {
  const factory = registry[name];
  if (!factory) {
    throw new Error(`Unsupported mail provider: ${name}.`);
  }
  return factory();
}
