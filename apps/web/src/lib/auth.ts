import { websiteConfig } from '@/config/website';
import {
  addMonthlyFreeCredits,
  addRegisterGiftCredits,
} from '@/credits/credits';
import { defaultMessages } from '@/i18n/messages';
import { LOCALE_COOKIE_NAME, routing } from '@/i18n/routing';
import { sendEmail } from '@/mail';
import { subscribe } from '@/newsletter';
import { createAuth } from '@repo/auth/server';
import type { AuthAppCallbacks } from '@repo/auth/server';
import type { User } from 'better-auth';
import type { Locale } from 'next-intl';
import { getAllPricePlans } from './price-plan';
import { getUrlWithLocaleInCallbackUrl } from './urls';

/**
 * Gets the locale from a request by parsing the cookies
 * If no locale is found in the cookies, returns the default locale
 *
 * @param request - The request to get the locale from
 * @returns The locale from the request or the default locale
 */
export function getLocaleFromRequest(request?: Request): Locale {
  const cookieStr = request?.headers.get('cookie') ?? '';
  const cookies = Object.fromEntries(
    cookieStr.split(';').map((c) => {
      const [key, ...v] = c.trim().split('=');
      return [key, v.join('=')];
    })
  );
  return (cookies[LOCALE_COOKIE_NAME] as Locale) ?? routing.defaultLocale;
}

/**
 * On create user hook
 *
 * @param user - The user to create
 */
async function onCreateUser(user: User) {
  // Auto subscribe user to newsletter after sign up if enabled in website config
  // Add a delay to avoid hitting Resend's 1 email per second limit
  if (
    user.email &&
    websiteConfig.newsletter.enable &&
    websiteConfig.newsletter.autoSubscribeAfterSignUp
  ) {
    // Delay newsletter subscription by 2 seconds to avoid rate limiting
    // This ensures the email verification email is sent first
    // Using 2 seconds instead of 1 to provide extra buffer for network delays
    setTimeout(async () => {
      try {
        const subscribed = await subscribe(user.email);
        if (!subscribed) {
          console.error(`Failed to subscribe user ${user.email} to newsletter`);
        } else {
          console.log(`User ${user.email} subscribed to newsletter`);
        }
      } catch (error) {
        console.error('Newsletter subscription error:', error);
      }
    }, 2000);
  }

  // Add register gift credits to the user if enabled in website config
  if (
    websiteConfig.credits.enableCredits &&
    websiteConfig.credits.registerGiftCredits.enable &&
    websiteConfig.credits.registerGiftCredits.amount > 0
  ) {
    try {
      await addRegisterGiftCredits(user.id);
      console.log(`added register gift credits for user ${user.id}`);
    } catch (error) {
      console.error('Register gift credits error:', error);
    }
  }

  // Add free monthly credits to the user if enabled in website config
  if (websiteConfig.credits.enableCredits) {
    const pricePlans = getAllPricePlans();
    // NOTICE: make sure the free plan is not disabled and has credits enabled
    const freePlan = pricePlans.find(
      (plan) => plan.isFree && !plan.disabled && plan.credits?.enable
    );
    if (freePlan) {
      try {
        await addMonthlyFreeCredits(user.id, freePlan.id);
        console.log(`added Free monthly credits for user ${user.id}`);
      } catch (error) {
        console.error('Free monthly credits error:', error);
      }
    }
  }
}

/**
 * App-specific auth callbacks
 *
 * These callbacks depend on app-layer modules (mail, i18n, credits, newsletter)
 * that are not available in the shared auth package.
 */
const authCallbacks: AuthAppCallbacks = {
  onUserCreate: onCreateUser,
  sendResetPassword: async (user, url, request) => {
    const locale = getLocaleFromRequest(request);
    const localizedUrl = getUrlWithLocaleInCallbackUrl(url, locale);

    await sendEmail({
      to: user.email,
      template: 'forgotPassword',
      context: {
        url: localizedUrl,
        name: user.name,
      },
      locale,
    });
  },
  sendVerificationEmail: async (user, url, token, request) => {
    const locale = getLocaleFromRequest(request);
    const localizedUrl = getUrlWithLocaleInCallbackUrl(url, locale);

    await sendEmail({
      to: user.email,
      template: 'verifyEmail',
      context: {
        url: localizedUrl,
        name: user.name,
      },
      locale,
    });
  },
};

/**
 * Better Auth configuration
 *
 * docs:
 * https://example.com/docs/auth
 * https://www.better-auth.com/docs/reference/options
 */
export const auth = await createAuth(authCallbacks);
