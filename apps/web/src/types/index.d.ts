import type { ReactNode } from 'react';

export type {
  WebsiteConfig,
  UiConfig,
  MetadataConfig,
  ModeConfig,
  ImagesConfig,
  SocialConfig,
  FeaturesConfig,
  AffiliatesConfig,
  AnalyticsConfig,
  ApiKeysConfig,
  AuthConfig,
  I18nConfig,
  BlogConfig,
  DocsConfig,
  MailConfig,
  NewsletterConfig,
  NotificationConfig,
  StorageConfig,
  PaymentConfig,
  PriceConfig,
  CreditsConfig,
  PricePlan,
} from '@repo/config';

export type MenuItem = {
  title: string;
  description?: string;
  icon?: ReactNode;
  href?: string;
  external?: boolean;
  authorizeOnly?: string[];
};

export type NestedMenuItem = MenuItem & {
  items?: MenuItem[];
};

export type BlogCategory = {
  slug: string;
  name: string;
  description: string;
};
