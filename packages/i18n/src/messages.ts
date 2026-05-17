import deepmerge from 'deepmerge';
import type { Locale, Messages, MessageLoader } from './types';

export type { MessageLoader };

/**
 * Merge messages with fallback
 *
 * https://next-intl.dev/docs/usage/configuration#messages
 */
export function mergeMessages(
  defaultMessages: Messages,
  localeMessages: Messages
): Messages {
  return deepmerge(defaultMessages, localeMessages, {
    arrayMerge: (_destinationArray, sourceArray) => sourceArray,
  });
}

/**
 * Create message getter with fallback support
 *
 * If you have incomplete messages for a given locale and would like to use messages
 * from another locale as a fallback, you can merge the two accordingly.
 */
export function createMessageGetter(
  loadMessages: MessageLoader,
  defaultLocale: string
) {
  return async (locale: Locale): Promise<Messages> => {
    const localeMessages = await loadMessages(locale);

    if (locale === defaultLocale) {
      return localeMessages;
    }

    const defaultMessages = await loadMessages(defaultLocale as Locale);
    return mergeMessages(defaultMessages, localeMessages);
  };
}
