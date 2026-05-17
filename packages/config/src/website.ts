import { clientEnv } from '@repo/env/client';
import { PaymentTypes, PlanIntervals, type WebsiteConfig } from './types';

/**
 * website config, without translations
 *
 * docs:
 * https://example.com/docs/config/website
 */
// Select payment provider via env, default to 'stripe'
const RAW_PROVIDER = (
  clientEnv.NEXT_PUBLIC_PAYMENT_PROVIDER || 'stripe'
).toLowerCase();
const PAYMENT_PROVIDER: 'stripe' | 'creem' =
  RAW_PROVIDER === 'creem' ? 'creem' : 'stripe';

const ENABLE_CREDITS_ENV = clientEnv.NEXT_PUBLIC_ENABLE_CREDITS;
const ENABLE_CREDITS =
  ENABLE_CREDITS_ENV !== undefined
    ? ENABLE_CREDITS_ENV
    : clientEnv.NEXT_PUBLIC_DEMO_WEBSITE === true;

const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: clientEnv.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
  PRO_YEARLY: clientEnv.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || '',
  LIFETIME: clientEnv.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME || '',
  CREDITS_BASIC: clientEnv.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_BASIC || '',
  CREDITS_STANDARD: clientEnv.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_STANDARD || '',
  CREDITS_PREMIUM: clientEnv.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_PREMIUM || '',
  CREDITS_ENTERPRISE:
    clientEnv.NEXT_PUBLIC_STRIPE_PRICE_CREDITS_ENTERPRISE || '',
};

const CREEM_PRICE_IDS = {
  PRO_MONTHLY: clientEnv.NEXT_PUBLIC_CREEM_PRODUCT_PRO_MONTHLY || '',
  PRO_YEARLY: clientEnv.NEXT_PUBLIC_CREEM_PRODUCT_PRO_YEARLY || '',
  LIFETIME: clientEnv.NEXT_PUBLIC_CREEM_PRODUCT_LIFETIME || '',
  CREDITS_BASIC: clientEnv.NEXT_PUBLIC_CREEM_PRODUCT_CREDITS_BASIC || '',
  CREDITS_STANDARD: clientEnv.NEXT_PUBLIC_CREEM_PRODUCT_CREDITS_STANDARD || '',
  CREDITS_PREMIUM: clientEnv.NEXT_PUBLIC_CREEM_PRODUCT_CREDITS_PREMIUM || '',
  CREDITS_ENTERPRISE:
    clientEnv.NEXT_PUBLIC_CREEM_PRODUCT_CREDITS_ENTERPRISE || '',
};

// Map plan price identifiers by provider
const PRICE_IDS =
  PAYMENT_PROVIDER === 'stripe' ? STRIPE_PRICE_IDS : CREEM_PRICE_IDS;

export const websiteConfig: WebsiteConfig = {
  ui: {
    mode: {
      defaultMode: 'light',
      enableSwitch: true,
    },
  },
  metadata: {
    images: {
      ogImage: '/aelokit-og.png',
      logoLight: '/aelokit-logo.png',
      logoDark: '/aelokit-logo.png',
    },
    social: {
      github: 'https://github.com/aelokit/aelokit',
      twitter: 'https://x.com/aelokit',
      blueSky: 'https://bsky.app/profile/aelokit.dev',
      discord: 'https://discord.gg/aelokit',
      mastodon: 'https://mastodon.social/@aelokit',
      linkedin: 'https://linkedin.com/company/aelokit',
      youtube: 'https://youtube.com/@aelokit',
    },
  },
  features: {
    enableUpgradeCard: true,
    enableUpdateAvatar: true,
    enableDatafastRevenueTrack: false,
    enableCrispChat: clientEnv.NEXT_PUBLIC_DEMO_WEBSITE === true,
    enableTurnstileCaptcha: clientEnv.NEXT_PUBLIC_DEMO_WEBSITE === true,
  },
  affiliates: {
    enable: false,
    provider: 'affonso',
  },
  analytics: {
    enableVercelAnalytics: false,
    enableSpeedInsights: false,
  },
  apikeys: {
    enable: clientEnv.NEXT_PUBLIC_DEMO_WEBSITE === true,
  },
  auth: {
    enableGoogleLogin: true,
    enableGithubLogin: true,
    enableCredentialLogin: true,
    enableDeleteUser: true,
  },
  i18n: {
    defaultLocale: 'en',
    locales: {
      en: {
        flag: '🇺🇸',
        name: 'English',
        hreflang: 'en',
      },
      zh: {
        flag: '🇨🇳',
        name: '中文',
        hreflang: 'zh-CN',
      },
    },
  },
  blog: {
    enable: true,
    paginationSize: 6,
    relatedPostsSize: 3,
  },
  docs: {
    enable: true,
  },
  mail: {
    enable: true,
    provider: 'resend',
    fromEmail: 'AeloKit <support@example.com>',
    supportEmail: 'AeloKit <support@example.com>',
  },
  newsletter: {
    enable: true,
    provider: 'resend',
    autoSubscribeAfterSignUp: true,
  },
  notification: {
    enable: true,
    provider: 'discord',
  },
  storage: {
    enable: true,
    provider: 's3',
  },
  payment: {
    provider: PAYMENT_PROVIDER,
  },
  price: {
    plans: {
      free: {
        id: 'free',
        prices: [],
        isFree: true,
        isLifetime: false,
        credits: {
          enable: true,
          amount: 50,
          expireDays: 30,
        },
      },
      pro: {
        id: 'pro',
        prices: [
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: PRICE_IDS.PRO_MONTHLY,
            amount: 990,
            currency: 'USD',
            interval: PlanIntervals.MONTH,
          },
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: PRICE_IDS.PRO_YEARLY,
            amount: 9900,
            currency: 'USD',
            interval: PlanIntervals.YEAR,
          },
        ],
        isFree: false,
        isLifetime: false,
        popular: true,
        credits: {
          enable: true,
          amount: 1000,
          expireDays: 30,
        },
      },
      lifetime: {
        id: 'lifetime',
        prices: [
          {
            type: PaymentTypes.ONE_TIME,
            priceId: PRICE_IDS.LIFETIME,
            amount: 19900,
            currency: 'USD',
            allowPromotionCode: true,
          },
        ],
        isFree: false,
        isLifetime: true,
        credits: {
          enable: true,
          amount: 1000,
          expireDays: 30,
        },
      },
    },
  },
  credits: {
    enableCredits: ENABLE_CREDITS,
    enablePackagesForFreePlan: true,
    registerGiftCredits: {
      enable: true,
      amount: 50,
      expireDays: 30,
    },
    packages: {
      basic: {
        id: 'basic',
        popular: false,
        amount: 100,
        expireDays: 30,
        price: {
          priceId: PRICE_IDS.CREDITS_BASIC,
          amount: 990,
          currency: 'USD',
          allowPromotionCode: true,
        },
      },
      standard: {
        id: 'standard',
        popular: true,
        amount: 200,
        expireDays: 30,
        price: {
          priceId: PRICE_IDS.CREDITS_STANDARD,
          amount: 1490,
          currency: 'USD',
          allowPromotionCode: true,
        },
      },
      premium: {
        id: 'premium',
        popular: false,
        amount: 500,
        expireDays: 30,
        price: {
          priceId: PRICE_IDS.CREDITS_PREMIUM,
          amount: 3990,
          currency: 'USD',
          allowPromotionCode: true,
        },
      },
      enterprise: {
        id: 'enterprise',
        popular: false,
        amount: 1000,
        expireDays: 30,
        price: {
          priceId: PRICE_IDS.CREDITS_ENTERPRISE,
          amount: 6990,
          currency: 'USD',
          allowPromotionCode: true,
        },
      },
    },
  },
};
