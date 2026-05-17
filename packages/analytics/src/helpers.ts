/**
 * Analytics helper utilities
 *
 * This module provides utility functions for analytics.
 */

import type { AnalyticsProperties, AnalyticsEventName } from './types';
import { clientEnv } from '@repo/env/client';

/**
 * Create a scoped event name
 *
 * Useful for creating consistent event naming across the application.
 *
 * @param scope - The scope (e.g., 'payment', 'auth')
 * @param event - The event name
 * @returns The scoped event name
 */
export function createScopedEventName(
  scope: string,
  event: string
): AnalyticsEventName {
  return `${scope}_${event}`;
}

/**
 * Merge analytics properties
 *
 * Safely merges multiple property objects.
 *
 * @param base - Base properties
 * @param additional - Additional properties to merge
 * @returns Merged properties
 */
export function mergeProperties(
  base?: AnalyticsProperties,
  additional?: AnalyticsProperties
): AnalyticsProperties {
  return {
    ...base,
    ...additional,
  };
}

/**
 * Add timestamp to properties
 *
 * @param properties - The properties to add timestamp to
 * @returns Properties with timestamp
 */
export function withTimestamp(
  properties?: AnalyticsProperties
): AnalyticsProperties {
  return {
    ...properties,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Add common context to properties
 *
 * @param properties - The properties to add context to
 * @param context - The context to add
 * @returns Properties with context
 */
export function withContext(
  properties: AnalyticsProperties | undefined,
  context: {
    locale?: string;
    path?: string;
    referrer?: string;
  }
): AnalyticsProperties {
  return {
    ...properties,
    ...context,
  };
}

/**
 * Sanitize properties for analytics
 *
 * Removes null, undefined, and function values.
 *
 * @param properties - The properties to sanitize
 * @returns Sanitized properties
 */
export function sanitizeProperties(
  properties?: AnalyticsProperties
): AnalyticsProperties {
  if (!properties) {
    return {};
  }

  const sanitized: AnalyticsProperties = {};

  for (const [key, value] of Object.entries(properties)) {
    if (value !== null && value !== undefined && typeof value !== 'function') {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Check if analytics should be enabled in the current environment
 *
 * @returns True if analytics should be enabled
 */
export function shouldEnableAnalytics(): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return clientEnv.NEXT_PUBLIC_ENABLE_ANALYTICS_IN_DEV === true;
  }

  return true;
}

/**
 * Create a safe event tracker
 *
 * Wraps an event tracking function with error handling.
 *
 * @param trackFn - The tracking function to wrap
 * @returns A safe tracking function
 */
export function createSafeTracker(
  trackFn: (eventName: string, properties?: AnalyticsProperties) => void
): (eventName: string, properties?: AnalyticsProperties) => void {
  return (eventName: string, properties?: AnalyticsProperties) => {
    try {
      if (shouldEnableAnalytics()) {
        trackFn(eventName, properties);
      }
    } catch (error) {
      // Log error but don't throw
      console.error('[Analytics] Error tracking event:', eventName, error);
    }
  };
}
