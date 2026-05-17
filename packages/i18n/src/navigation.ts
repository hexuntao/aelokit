import { createNavigation } from 'next-intl/navigation';

/**
 * Create navigation APIs from routing configuration
 *
 * https://next-intl.dev/docs/routing/navigation
 * https://github.com/amannn/next-intl/blob/main/examples/example-app-router/src/i18n/navigation.ts
 */
export function createNavigationAPIs(routing: any) {
  return createNavigation(routing);
}
