// Types
export type {
  Locale,
  Messages,
  MessageLoader,
  I18nRoutingConfig,
} from './types';

// Routing
export {
  createI18nRouting,
  createRouting,
  getDefaultLocale,
  getLocales,
  LOCALE_COOKIE_NAME,
} from './routing';

// Navigation
export { createNavigationAPIs } from './navigation';

// Messages
export { mergeMessages, createMessageGetter } from './messages';

// Request
export { createRequestConfig } from './request';

// URLs
export {
  getBaseUrl,
  shouldAppendLocale,
  getPathWithLocale,
  getUrlWithLocale,
  getUrlWithLocaleInCallbackUrl,
  getImageUrl,
  getMarkdownUrlWithLocale,
  getStripeDashboardCustomerUrl,
} from './urls';

// Hreflang
export {
  getHreflangValue,
  generateHreflangUrls,
  getCurrentHreflang,
  generateAlternates,
} from './hreflang';

// Docs
export { createDocsI18nConfig } from './docs';
