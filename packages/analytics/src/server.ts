/**
 * Server-side analytics helpers
 *
 * This module provides server-safe analytics helpers.
 * These functions can only be used in server-side code.
 *
 * IMPORTANT:
 * - Can read server environment variables
 * - Can use Node-only analytics SDKs
 * - Does not depend on React or Next runtime
 * - All userId/event/properties must be passed as parameters
 */

import type {
  AnalyticsProperties,
  CaptureEventParams,
  IdentifyUserParams,
} from './types';
import { serverEnv } from '@repo/env/server';

/**
 * Capture an event on the server side
 *
 * This is a placeholder that can be implemented by the app layer
 * using the specific analytics provider SDK (e.g., posthog-node).
 *
 * @param params - The capture parameters
 */
export async function captureServerEvent(
  params: CaptureEventParams
): Promise<void> {
  // The actual implementation should be done in apps/web
  // using the specific analytics provider SDK
  // This is a no-op placeholder to establish the interface
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics Server] captureEvent:', params);
  }
}

/**
 * Identify a user on the server side
 *
 * @param params - The identify parameters
 */
export async function identifyServerUser(
  params: IdentifyUserParams
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics Server] identifyUser:', params);
  }
}

/**
 * Capture a batch of events on the server side
 *
 * @param events - Array of events to capture
 */
export async function captureServerEventBatch(
  events: CaptureEventParams[]
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[Analytics Server] captureEventBatch:',
      events.length,
      'events'
    );
  }
}

/**
 * Set server-side analytics properties for a user
 *
 * @param distinctId - The distinct user ID
 * @param properties - The properties to set
 */
export async function setServerAnalyticsProperties(
  distinctId: string,
  properties: AnalyticsProperties
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics Server] setProperties:', distinctId, properties);
  }
}

/**
 * Flush any pending analytics events
 *
 * This is important for serverless environments where the process
 * may be terminated before events are sent.
 */
export async function flushAnalytics(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics Server] flush');
  }
}

/**
 * Check if server-side analytics is enabled
 */
export function isServerAnalyticsEnabled(): boolean {
  if (serverEnv.POSTHOG_API_KEY) {
    return true;
  }

  return false;
}
