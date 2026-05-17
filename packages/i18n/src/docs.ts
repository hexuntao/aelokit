import type { I18nConfig } from 'fumadocs-core/i18n';

/**
 * Create FumaDocs i18n configuration
 *
 * https://fumadocs.dev/docs/ui/internationalization
 */
export function createDocsI18nConfig(
  defaultLocale: string,
  locales: string[]
): I18nConfig {
  return {
    defaultLanguage: defaultLocale,
    languages: locales,
    hideLocale: 'default-locale',
    parser: 'dot' as const,
  };
}
