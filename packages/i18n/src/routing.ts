import type { I18nConfig } from '@repo/config';
import { defineRouting } from 'next-intl/routing';
import type { I18nRoutingConfig, Locale } from './types';

/**
 * The name of the cookie that is used to determine the locale
 */
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

/**
 * Create i18n routing configuration from website config
 */
export function createI18nRouting(i18nConfig: I18nConfig): I18nRoutingConfig {
  const locales = Object.keys(i18nConfig.locales);
  const defaultLocale = i18nConfig.defaultLocale;

  return {
    locales,
    defaultLocale,
    localeCookie: {
      name: LOCALE_COOKIE_NAME,
    },
    localePrefix: 'as-needed',
    localeDetection: false,
  };
}

/**
 * Create next-intl routing object
 *
 * https://next-intl.dev/docs/routing
 * https://github.com/amannn/next-intl/blob/main/examples/example-app-router/src/i18n/routing.ts
 */
export function createRouting(i18nConfig: I18nConfig) {
  const config = createI18nRouting(i18nConfig);

  return defineRouting({
    locales: config.locales,
    defaultLocale: config.defaultLocale,
    localeDetection: config.localeDetection,
    localeCookie: config.localeCookie,
    localePrefix: config.localePrefix,
  });
}

/**
 * Get default locale from i18n config
 */
export function getDefaultLocale(i18nConfig: I18nConfig): string {
  return i18nConfig.defaultLocale;
}

/**
 * Get locales from i18n config
 */
export function getLocales(i18nConfig: I18nConfig): string[] {
  return Object.keys(i18nConfig.locales);
}

export type { Locale };
