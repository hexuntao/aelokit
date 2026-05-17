/**
 * Analytics provider interface
 *
 * This module defines the interface that analytics providers must implement.
 * The interface is designed to be minimal and provider-agnostic.
 */

import type {
  AnalyticsResult,
  IdentifyUserParams,
  PageViewParams,
  TrackEventParams,
} from './types';

/**
 * Analytics provider interface
 *
 * All analytics providers must implement this interface.
 * Methods are optional to allow providers to implement only what they support.
 */
export interface AnalyticsProvider {
  /**
   * Track an event
   */
  track(params: TrackEventParams): AnalyticsResult;

  /**
   * Identify a user
   */
  identify?(params: IdentifyUserParams): AnalyticsResult;

  /**
   * Track a page view
   */
  pageView?(params: PageViewParams): AnalyticsResult;

  /**
   * Flush any pending events (useful for server-side providers)
   */
  flush?(): Promise<void>;

  /**
   * Get the provider name
   */
  getProviderName(): string;
}
