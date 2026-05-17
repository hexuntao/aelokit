import { createRequestConfig } from '@repo/i18n/request';
import type { Locale, Messages } from 'next-intl';
import { routing } from './routing';

const importLocale = async (locale: Locale): Promise<Messages> => {
  return (await import(`../../messages/${locale}.json`)).default as Messages;
};

/**
 * i18n/request.ts can be used to provide configuration for server-only code,
 * i.e. Server Components, Server Actions & friends.
 * The configuration is provided via the getRequestConfig function.
 *
 * The configuration object is created once for each request by internally using React's cache.
 * The first component to use internationalization will call the function defined with getRequestConfig.
 *
 * https://next-intl.dev/docs/usage/configuration
 * https://github.com/amannn/next-intl/blob/main/examples/example-app-router/src/i18n/request.ts
 */
export default createRequestConfig(
  routing.locales,
  routing.defaultLocale,
  importLocale
);
