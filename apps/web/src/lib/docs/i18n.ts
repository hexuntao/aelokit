import { createDocsI18nConfig } from '@repo/i18n/docs';
import { DEFAULT_LOCALE, LOCALES } from '@/i18n/routing';

/**
 * Internationalization configuration for FumaDocs
 *
 * https://fumadocs.dev/docs/ui/internationalization
 */
export const docsI18nConfig = createDocsI18nConfig(DEFAULT_LOCALE, LOCALES);
