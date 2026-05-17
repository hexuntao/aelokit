/**
 * Analytics types
 *
 * This module defines the core types for the analytics domain.
 * These types are shared between client and server.
 */

/**
 * Supported analytics provider names
 */
export type AnalyticsProviderName =
  | 'posthog'
  | 'openpanel'
  | 'google'
  | 'plausible'
  | 'umami'
  | 'clarity'
  | 'ahrefs'
  | 'seline'
  | 'datafast'
  | 'vercel';

/**
 * Analytics event name
 * Common event names used across the application
 */
export type AnalyticsEventName = string;

/**
 * Analytics event properties
 * Generic properties that can be attached to any event
 */
export type AnalyticsProperties = Record<string, unknown>;

/**
 * Analytics user identity
 */
export interface AnalyticsUser {
  id: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Parameters for tracking an event
 */
export interface TrackEventParams {
  eventName: AnalyticsEventName;
  properties?: AnalyticsProperties;
}

/**
 * Parameters for identifying a user
 */
export interface IdentifyUserParams {
  userId: string;
  traits?: AnalyticsUser;
}

/**
 * Parameters for tracking a page view
 */
export interface PageViewParams {
  path?: string;
  title?: string;
  properties?: AnalyticsProperties;
}

/**
 * Parameters for capturing a server-side event
 */
export interface CaptureEventParams {
  distinctId: string;
  eventName: AnalyticsEventName;
  properties?: AnalyticsProperties;
}

/**
 * Result of an analytics operation
 */
export type AnalyticsResult = void | Promise<void>;

/**
 * Analytics provider configuration
 */
export interface AnalyticsProviderConfig {
  name: AnalyticsProviderName;
  enabled: boolean;
}
