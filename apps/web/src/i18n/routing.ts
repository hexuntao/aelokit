import { websiteConfig } from '@/config/website';
import {
  createRouting,
  getDefaultLocale,
  getLocales,
} from '@repo/i18n/routing';

export const DEFAULT_LOCALE = getDefaultLocale(websiteConfig.i18n);
export const LOCALES = getLocales(websiteConfig.i18n);
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

/**
 * Next.js internationalized routing
 *
 * https://next-intl.dev/docs/routing
 * https://github.com/amannn/next-intl/blob/main/examples/example-app-router/src/i18n/routing.ts
 */
export const routing = createRouting(websiteConfig.i18n);
