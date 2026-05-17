import type { Locale, Messages } from 'next-intl';

export type { Locale, Messages };

/**
 * Message loader function type
 */
export type MessageLoader = (locale: Locale) => Promise<Messages>;

/**
 * I18n routing configuration
 */
export interface I18nRoutingConfig {
  locales: string[];
  defaultLocale: string;
  localeCookie: {
    name: string;
  };
  localePrefix: 'as-needed' | 'always' | 'never';
  localeDetection: boolean;
}
