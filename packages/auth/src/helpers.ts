import { parse as parseCookies } from 'cookie';
import type { Session, SessionUser } from './types';

/**
 * Check if a user has admin role
 */
export function isAdmin(user: SessionUser): boolean {
  return user.role === 'admin';
}

/**
 * Gets the locale from a request by parsing the cookies
 * If no locale is found in the cookies, returns the default locale
 *
 * @param request - The request to get the locale from
 * @param cookieName - The name of the locale cookie
 * @param defaultLocale - The default locale to return if no cookie is found
 * @returns The locale from the request or the default locale
 */
export function getLocaleFromRequest(
  request?: Request,
  cookieName: string = 'NEXT_LOCALE',
  defaultLocale: string = 'en'
): string {
  const cookies = parseCookies(request?.headers.get('cookie') ?? '');
  return (cookies[cookieName] as string | undefined) ?? defaultLocale;
}
