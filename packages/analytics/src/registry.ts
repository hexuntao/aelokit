/**
 * Analytics provider registry
 *
 * This module provides a registry for analytics providers.
 * It allows the app to get the configured analytics provider(s).
 */

import type { AnalyticsProviderName } from './types';
import type { AnalyticsProvider } from './provider';
import { getAnalyticsStatus } from './config';

/**
 * Get the list of enabled analytics providers
 *
 * @returns Array of enabled provider names
 */
export function getEnabledAnalyticsProviders(): AnalyticsProviderName[] {
  const status = getAnalyticsStatus();
  const enabled: AnalyticsProviderName[] = [];

  if (status.posthog) {
    enabled.push('posthog');
  }
  if (status.openpanel) {
    enabled.push('openpanel');
  }
  if (status.google) {
    enabled.push('google');
  }
  if (status.plausible) {
    enabled.push('plausible');
  }
  if (status.umami) {
    enabled.push('umami');
  }
  if (status.clarity) {
    enabled.push('clarity');
  }
  if (status.ahrefs) {
    enabled.push('ahrefs');
  }
  if (status.seline) {
    enabled.push('seline');
  }
  if (status.datafast) {
    enabled.push('datafast');
  }
  if (status.vercel) {
    enabled.push('vercel');
  }

  return enabled;
}

/**
 * Check if any analytics provider is enabled
 */
export function hasEnabledAnalyticsProvider(): boolean {
  return getEnabledAnalyticsProviders().length > 0;
}

/**
 * Get the primary analytics provider
 *
 * Returns the first enabled provider, or undefined if none are enabled.
 * Priority order: posthog > openpanel > google > others
 */
export function getPrimaryAnalyticsProvider():
  | AnalyticsProviderName
  | undefined {
  const enabled = getEnabledAnalyticsProviders();

  // Priority order
  const priority: AnalyticsProviderName[] = [
    'posthog',
    'openpanel',
    'google',
    'plausible',
    'umami',
    'vercel',
  ];

  for (const provider of priority) {
    if (enabled.includes(provider)) {
      return provider;
    }
  }

  return enabled[0];
}

/**
 * Provider registry
 *
 * Stores registered analytics provider instances.
 * Providers are registered by the app layer.
 */
const providerRegistry = new Map<string, AnalyticsProvider>();

/**
 * Register an analytics provider
 *
 * @param provider - The provider instance
 */
export function registerAnalyticsProvider(provider: AnalyticsProvider): void {
  providerRegistry.set(provider.getProviderName(), provider);
}

/**
 * Get a registered analytics provider by name
 *
 * @param name - The provider name
 * @returns The provider instance, or undefined if not registered
 */
export function getAnalyticsProvider(
  name: AnalyticsProviderName
): AnalyticsProvider | undefined {
  return providerRegistry.get(name);
}

/**
 * Get all registered analytics providers
 *
 * @returns Array of registered provider instances
 */
export function getAnalyticsProviders(): AnalyticsProvider[] {
  return Array.from(providerRegistry.values());
}

/**
 * Clear the provider registry
 *
 * Useful for testing
 */
export function clearProviderRegistry(): void {
  providerRegistry.clear();
}
