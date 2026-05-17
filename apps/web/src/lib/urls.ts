import { routing } from '@/i18n/routing';
import {
  getBaseUrl,
  shouldAppendLocale,
  getPathWithLocale,
  getUrlWithLocale,
  getUrlWithLocaleInCallbackUrl,
  getImageUrl,
  getMarkdownUrlWithLocale,
  getStripeDashboardCustomerUrl,
} from '@repo/i18n/urls';
import type { Locale } from 'next-intl';

export { getBaseUrl, getImageUrl, getStripeDashboardCustomerUrl };

/**
 * Check if the locale should be appended to the URL
 */
export function shouldAppendLocaleForCurrentConfig(
  locale?: Locale | null
): boolean {
  return shouldAppendLocale(locale, routing.defaultLocale);
}

/**
 * Get the path with the locale prepended (relative path, no base URL)
 * e.g. getPathWithLocale('/dashboard', 'zh') => '/zh/dashboard'
 * e.g. getPathWithLocale('/dashboard', 'en') => '/dashboard'
 */
export function getPathWithLocaleForCurrentConfig(
  path: string,
  locale?: Locale | null
): string {
  return getPathWithLocale(path, locale, routing.defaultLocale);
}

/**
 * Get the URL of the application with the locale appended
 */
export function getUrlWithLocaleForCurrentConfig(
  url: string,
  locale?: Locale | null
): string {
  return getUrlWithLocale(url, locale, routing.defaultLocale);
}

/**
 * Adds locale to the callbackURL parameter in authentication URLs
 */
export function getUrlWithLocaleInCallbackUrlForCurrentConfig(
  url: string,
  locale: Locale
): string {
  return getUrlWithLocaleInCallbackUrl(url, locale, routing.defaultLocale);
}

/**
 * Normalize URL by removing any existing locale prefix and adding the current locale
 */
export function getMarkdownUrlWithLocaleForCurrentConfig(
  url: string,
  locale: Locale
): string {
  return getMarkdownUrlWithLocale(url, locale, routing.locales);
}

// Keep backward compatibility with existing imports
export { shouldAppendLocaleForCurrentConfig as shouldAppendLocale };
export { getPathWithLocaleForCurrentConfig as getPathWithLocale };
export { getUrlWithLocaleForCurrentConfig as getUrlWithLocale };
export {
  getUrlWithLocaleInCallbackUrlForCurrentConfig as getUrlWithLocaleInCallbackUrl,
};
export { getMarkdownUrlWithLocaleForCurrentConfig as getMarkdownUrlWithLocale };
