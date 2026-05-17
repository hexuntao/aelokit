import { clientEnv } from '@repo/env/client';
import type { Locale } from './types';

/**
 * Get base URL from environment
 */
export function getBaseUrl(): string {
  return clientEnv.NEXT_PUBLIC_BASE_URL ?? `http://localhost:3000`;
}

/**
 * Check if the locale should be appended to the URL
 */
export function shouldAppendLocale(
  locale: Locale | null | undefined,
  defaultLocale: string
): boolean {
  return !!locale && locale !== defaultLocale && locale !== 'default';
}

/**
 * Get the path with the locale prepended (relative path, no base URL)
 * e.g. getPathWithLocale('/dashboard', 'zh', 'en') => '/zh/dashboard'
 * e.g. getPathWithLocale('/dashboard', 'en', 'en') => '/dashboard'
 */
export function getPathWithLocale(
  path: string,
  locale: Locale | null | undefined,
  defaultLocale: string
): string {
  return shouldAppendLocale(locale, defaultLocale) ? `/${locale}${path}` : path;
}

/**
 * Get the URL of the application with the locale appended
 */
export function getUrlWithLocale(
  url: string,
  locale: Locale | null | undefined,
  defaultLocale: string
): string {
  return shouldAppendLocale(locale, defaultLocale)
    ? `${getBaseUrl()}/${locale}${url}`
    : `${getBaseUrl()}${url}`;
}

/**
 * Adds locale to the callbackURL parameter in authentication URLs
 *
 * Example:
 * Input: http://localhost:3000/api/auth/reset-password/token?callbackURL=/auth/reset-password
 * Output: http://localhost:3000/api/auth/reset-password/token?callbackURL=/zh/auth/reset-password
 *
 * Input: http://localhost:3000/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiJ9&callbackURL=/dashboard
 * Output: http://localhost:3000/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiJ9&callbackURL=/zh/dashboard
 *
 * @param url - The original URL with callbackURL parameter
 * @param locale - The locale to add to the callbackURL
 * @param defaultLocale - The default locale
 * @returns The URL with locale added to callbackURL if necessary
 */
export function getUrlWithLocaleInCallbackUrl(
  url: string,
  locale: Locale,
  defaultLocale: string
): string {
  if (!shouldAppendLocale(locale, defaultLocale)) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const callbackURL = urlObj.searchParams.get('callbackURL');

    if (callbackURL) {
      if (!callbackURL.match(new RegExp(`^/${locale}(/|$)`))) {
        const localizedCallbackURL = callbackURL.startsWith('/')
          ? `/${locale}${callbackURL}`
          : `/${locale}/${callbackURL}`;
        urlObj.searchParams.set('callbackURL', localizedCallbackURL);
      }
    }

    return urlObj.toString();
  } catch (error) {
    console.warn('Failed to parse URL for locale insertion:', url, error);
    return url;
  }
}

/**
 * Get the URL of the image, if the image is a relative path, it will be prefixed with the base URL
 * @param image - The image URL
 * @returns The URL of the image
 */
export function getImageUrl(image: string): string {
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  if (image.startsWith('/')) {
    return `${getBaseUrl()}${image}`;
  }
  return `${getBaseUrl()}/${image}`;
}

/**
 * Normalize URL by removing any existing locale prefix and adding the current locale
 * Used for building markdown URLs for LLM endpoints
 * @param url - The URL that might contain a locale prefix (e.g., /zh/docs/comparisons or /docs/what-is-fumadocs)
 * @param locale - The current locale to use
 * @param locales - All supported locales
 * @returns The normalized URL with current locale prefix and .mdx extension (e.g., /en/docs/what-is-fumadocs.mdx)
 */
export function getMarkdownUrlWithLocale(
  url: string,
  locale: Locale,
  locales: string[]
): string {
  const localePattern = new RegExp(`^/(${locales.join('|')})/`);
  const normalizedUrl = url.replace(localePattern, '/');
  const urlWithSlash = normalizedUrl.startsWith('/')
    ? normalizedUrl
    : `/${normalizedUrl}`;
  return `/${locale}${urlWithSlash}.mdx`;
}

/**
 * Get the Stripe dashboard customer URL
 * @param customerId - The Stripe customer ID
 * @returns The Stripe dashboard customer URL
 */
export function getStripeDashboardCustomerUrl(customerId: string): string {
  if (process.env.NODE_ENV === 'development') {
    return `https://dashboard.stripe.com/test/customers/${customerId}`;
  }
  return `https://dashboard.stripe.com/customers/${customerId}`;
}
