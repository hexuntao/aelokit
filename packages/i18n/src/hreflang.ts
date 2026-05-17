import type { I18nConfig } from '@repo/config';
import type { Locale } from './types';
import { getBaseUrl } from './urls';

/**
 * Get the proper hreflang value for a locale
 * Reads from website config, falls back to locale code if not configured
 */
export function getHreflangValue(
  locale: Locale,
  i18nConfig: I18nConfig
): string {
  const localeConfig = i18nConfig.locales[locale];
  return localeConfig?.hreflang || locale;
}

/**
 * Generate hreflang URLs for all locales for a given path
 * Following Google's best practices:
 * 1. Self-referencing hreflang tag
 * 2. Identical set of hreflang tags across all page versions
 * 3. x-default tag for unmatched languages
 */
export function generateHreflangUrls(
  pathname: string,
  locales: string[],
  defaultLocale: string,
  i18nConfig: I18nConfig
): Record<string, string> {
  const hreflangUrls: Record<string, string> = {};
  const baseUrl = getBaseUrl();

  for (const locale of locales) {
    const localePath =
      locale === defaultLocale ? pathname : `/${locale}${pathname}`;
    const fullUrl = `${baseUrl}${localePath}`;
    const hreflangValue = getHreflangValue(locale as Locale, i18nConfig);
    hreflangUrls[hreflangValue] = fullUrl;
  }

  // Add x-default pointing to the default locale
  const defaultPath = pathname;
  hreflangUrls['x-default'] = `${baseUrl}${defaultPath}`;

  return hreflangUrls;
}

/**
 * Get current locale's hreflang value
 */
export function getCurrentHreflang(
  locale: Locale,
  i18nConfig: I18nConfig
): string {
  return getHreflangValue(locale, i18nConfig);
}

/**
 * Generate alternates object for Next.js metadata
 * https://nextjs.org/docs/app/api-reference/functions/generate-metadata#alternates
 */
export function generateAlternates(
  pathname: string,
  locales: string[],
  defaultLocale: string,
  i18nConfig: I18nConfig
) {
  const hreflangUrls = generateHreflangUrls(
    pathname,
    locales,
    defaultLocale,
    i18nConfig
  );

  return {
    languages: Object.fromEntries(
      Object.entries(hreflangUrls).filter(([key]) => key !== 'x-default')
    ),
  };
}
