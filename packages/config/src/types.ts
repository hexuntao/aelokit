/**
 * website config, without translations
 */
export type WebsiteConfig = {
  ui: UiConfig;
  metadata: MetadataConfig;
  features: FeaturesConfig;
  affiliates?: AffiliatesConfig;
  analytics: AnalyticsConfig;
  apikeys: ApiKeysConfig;
  auth: AuthConfig;
  i18n: I18nConfig;
  blog: BlogConfig;
  docs: DocsConfig;
  mail: MailConfig;
  newsletter: NewsletterConfig;
  notification?: NotificationConfig;
  storage: StorageConfig;
  payment: PaymentConfig;
  price: PriceConfig;
  credits: CreditsConfig;
};

/**
 * UI configuration
 */
export interface UiConfig {
  mode?: ModeConfig;
}

/**
 * Website metadata
 */
export interface MetadataConfig {
  images?: ImagesConfig;
  social?: SocialConfig;
}

export interface ModeConfig {
  defaultMode?: 'light' | 'dark' | 'system'; // The default mode of the website
  enableSwitch?: boolean; // Whether to enable the mode switch
}

export interface ImagesConfig {
  ogImage?: string; // The image as Open Graph image
  logoLight?: string; // The light logo image
  logoDark?: string; // The dark logo image
}

/**
 * Social media configuration
 */
export interface SocialConfig {
  twitter?: string;
  github?: string;
  discord?: string;
  blueSky?: string;
  mastodon?: string;
  youtube?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  telegram?: string;
}

/**
 * Website features
 */
export interface FeaturesConfig {
  enableCrispChat?: boolean; // Whether to enable the crisp chat
  enableUpgradeCard?: boolean; // Whether to enable the upgrade card in the sidebar
  enableUpdateAvatar?: boolean; // Whether to enable the update avatar in settings
  enableDatafastRevenueTrack?: boolean; // Whether to enable datafast revenue tracking
  enableTurnstileCaptcha?: boolean; // Whether to enable turnstile captcha
}

/** Affiliates configuration */
export interface AffiliatesConfig {
  enable: boolean; // Whether to enable the affiliates
  provider?: 'affonso' | 'promotekit'; // The affiliate provider
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  enableVercelAnalytics?: boolean; // Whether to enable vercel analytics
  enableSpeedInsights?: boolean; // Whether to enable speed insights
}

/**
 * API keys configuration
 */
export interface ApiKeysConfig {
  enable: boolean; // Whether to enable the api keys
}

/**
 * Auth configuration
 */
export interface AuthConfig {
  enableGoogleLogin?: boolean; // Whether to enable google login
  enableGithubLogin?: boolean; // Whether to enable github login
  enableCredentialLogin?: boolean; // Whether to enable email/password login
  enableDeleteUser?: boolean; // Whether to enable user deletion
}

/**
 * I18n configuration
 *
 * hreflang: Hreflang value for SEO (e.g., 'en', 'zh-CN')
 * https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
 * https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
 */
export interface I18nConfig {
  defaultLocale: string; // The default locale of the website
  locales: Record<
    string,
    {
      flag?: string; // The flag of the locale, leave empty if you don't want to display the flag
      name: string; // The name of the locale
      hreflang?: string; // Hreflang value for SEO (e.g., 'en', 'zh-CN')
    }
  >;
}

/**
 * Blog configuration
 */
export interface BlogConfig {
  enable: boolean; // Whether to enable the blog
  paginationSize: number; // Number of posts per page
  relatedPostsSize: number; // Number of related posts to show
}

/**
 * Docs configuration
 */
export interface DocsConfig {
  enable: boolean; // Whether to enable the docs
}

/**
 * Mail configuration
 */
export interface MailConfig {
  enable: boolean; // Whether to enable the mail
  provider: 'resend'; // The email provider, only resend is supported for now
  fromEmail?: string; // The email address to send from
  supportEmail?: string; // The email address to send support emails to
}

/**
 * Newsletter configuration
 */
export interface NewsletterConfig {
  enable: boolean; // Whether to enable the newsletter
  provider: 'resend' | 'beehiiv'; // The newsletter provider
  autoSubscribeAfterSignUp?: boolean; // Whether to automatically subscribe users to the newsletter after sign up
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  enable: boolean; // Whether to enable notifications
  provider?: 'discord' | 'feishu'; // The notification provider
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  enable: boolean; // Whether to enable the storage
  provider: 's3'; // The storage provider, only s3 is supported for now
}

/**
 * Payment configuration
 */
export interface PaymentConfig {
  provider: 'stripe' | 'creem'; // The payment provider, only stripe and creem are supported for now
}

/**
 * Price configuration
 */
export interface PriceConfig {
  plans: Record<string, PricePlan>; // Plans indexed by ID
}

/**
 * Credits configuration
 */
export interface CreditsConfig {
  enableCredits: boolean; // Whether to enable credits
  enablePackagesForFreePlan: boolean; // Whether to enable purchase credits for free plan users
  registerGiftCredits: {
    enable: boolean; // Whether to enable register gift credits
    amount: number; // The amount of credits to give to the user
    expireDays?: number; // The number of days to expire the credits, undefined means no expire
  };
  packages: Record<string, CreditPackage>; // Packages indexed by ID
}

/** Payment provider name from website config */
export type PaymentProviderName = NonNullable<PaymentConfig['provider']>;

/**
 * Interval types for subscription plans
 */
export type PlanInterval = PlanIntervals.MONTH | PlanIntervals.YEAR;

export enum PlanIntervals {
  MONTH = 'month',
  YEAR = 'year',
}

/**
 * Payment type (subscription or one-time)
 */
export type PaymentType = PaymentTypes.SUBSCRIPTION | PaymentTypes.ONE_TIME;

export enum PaymentTypes {
  SUBSCRIPTION = 'subscription', // Regular recurring subscription
  ONE_TIME = 'one_time', // One-time payment
}

/**
 * Price definition for a plan
 */
export interface Price {
  type: PaymentType; // Type of payment (subscription or one_time)
  priceId: string; // Stripe price ID (not product id)
  amount: number; // Price amount in currency units (dollars, euros, etc.)
  currency: string; // Currency code (e.g., USD)
  interval?: PlanInterval; // Billing interval for recurring payments
  trialPeriodDays?: number; // Free trial period in days
  allowPromotionCode?: boolean; // Whether to allow promotion code for this price
  disabled?: boolean; // Whether to disable this price in UI
}

/**
 * Credits configuration for a plan
 */
export interface Credits {
  enable: boolean; // Whether to enable credits for this plan
  amount: number; // Number of credits provided per month
  expireDays?: number; // Number of days until credits expire, undefined means no expiration
}

/**
 * Price plan definition
 *
 * 1. When to set the plan disabled?
 * When the plan is not available anymore, but you should keep it for existing users
 * who have already purchased it, otherwise they can not see the plan in the Billing page.
 *
 * 2. When to set the price disabled?
 * When the price is not available anymore, but you should keep it for existing users
 * who have already purchased it, otherwise they can not see the price in the Billing page.
 */
export interface PricePlan {
  id: string; // Unique identifier for the plan
  name?: string; // Display name of the plan
  description?: string; // Description of the plan features
  features?: string[]; // List of features included in this plan
  limits?: string[]; // List of limits for this plan
  prices: Price[]; // Available prices for this plan
  isFree: boolean; // Whether this is a free plan
  isLifetime: boolean; // Whether this is a lifetime plan
  popular?: boolean; // Whether to mark this plan as popular in UI
  disabled?: boolean; // Whether to disable this plan in UI
  credits?: Credits; // Credits configuration for this plan
}

/**
 * Credit package price
 */
export interface CreditPackagePrice {
  priceId: string; // Stripe price ID (not product id)
  amount: number; // Price amount in currency units (dollars, euros, etc.)
  currency: string; // Currency code (e.g., USD)
  allowPromotionCode?: boolean; // Whether to allow promotion code for this price
}

/**
 * Credit package
 */
export interface CreditPackage {
  id: string; // Unique identifier for the package
  amount: number; // Amount of credits in the package
  price: CreditPackagePrice; // Price of the package
  popular: boolean; // Whether the package is popular
  name?: string; // Display name of the package
  description?: string; // Description of the package
  expireDays?: number; // Number of days to expire the credits, undefined means no expire
  disabled?: boolean; // Whether the package is disabled in the UI
}
