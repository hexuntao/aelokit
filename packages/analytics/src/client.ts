/**
 * Client-side analytics helpers
 *
 * This module provides browser-safe analytics helpers.
 * These functions can be safely imported in client-side code.
 *
 * IMPORTANT:
 * - Only uses NEXT_PUBLIC_* environment variables
 * - Does not import server.ts
 * - Does not import Node-only packages
 * - Does not import next/headers or next/server
 */

import type {
  AnalyticsProperties,
  IdentifyUserParams,
  PageViewParams,
  TrackEventParams,
} from './types';

/**
 * Track an event on the client side
 *
 * This is a placeholder that can be implemented by the app layer
 * using the specific analytics provider (e.g., PostHog, OpenPanel).
 *
 * @param params - The event parameters
 */
export function trackEvent(params: TrackEventParams): void {
  if (typeof window === 'undefined') {
    return;
  }

  // The actual implementation should be done in apps/web
  // using the specific analytics provider
  // This is a no-op placeholder to establish the interface
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] trackEvent:', params);
  }
}

/**
 * Track a page view on the client side
 *
 * @param params - The page view parameters
 */
export function trackPageView(params?: PageViewParams): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] trackPageView:', params);
  }
}

/**
 * Identify a user on the client side
 *
 * @param params - The identify parameters
 */
export function identifyUser(params: IdentifyUserParams): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] identifyUser:', params);
  }
}

/**
 * Reset the analytics user (e.g., on logout)
 */
export function resetAnalyticsUser(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] resetAnalyticsUser');
  }
}

/**
 * Set analytics properties
 *
 * @param properties - The properties to set
 */
export function setAnalyticsProperties(properties: AnalyticsProperties): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] setAnalyticsProperties:', properties);
  }
}
