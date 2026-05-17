/**
 * Analytics configuration
 *
 * This module provides functions to read analytics configuration
 * from environment variables and website config.
 */

import { clientEnv } from '@repo/env/client';
import { websiteConfig } from '@repo/config';

/**
 * Check if PostHog is enabled
 * PostHog requires both key and host to be set
 */
export function isPostHogEnabled(): boolean {
  const key = clientEnv.NEXT_PUBLIC_POSTHOG_KEY;
  const host = clientEnv.NEXT_PUBLIC_POSTHOG_HOST;
  return Boolean(key && host);
}

/**
 * Get PostHog configuration
 */
export function getPostHogConfig() {
  return {
    key: clientEnv.NEXT_PUBLIC_POSTHOG_KEY,
    host: clientEnv.NEXT_PUBLIC_POSTHOG_HOST,
    enabled: isPostHogEnabled(),
  };
}

/**
 * Check if OpenPanel is enabled
 */
export function isOpenPanelEnabled(): boolean {
  const clientId = clientEnv.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;
  return Boolean(clientId);
}

/**
 * Get OpenPanel configuration
 */
export function getOpenPanelConfig() {
  return {
    clientId: clientEnv.NEXT_PUBLIC_OPENPANEL_CLIENT_ID,
    enabled: isOpenPanelEnabled(),
  };
}

/**
 * Check if Google Analytics is enabled
 */
export function isGoogleAnalyticsEnabled(): boolean {
  const analyticsId = clientEnv.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  return Boolean(analyticsId);
}

/**
 * Get Google Analytics configuration
 */
export function getGoogleAnalyticsConfig() {
  return {
    analyticsId: clientEnv.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
    enabled: isGoogleAnalyticsEnabled(),
  };
}

/**
 * Check if Plausible is enabled
 */
export function isPlausibleEnabled(): boolean {
  const domain = clientEnv.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const script = clientEnv.NEXT_PUBLIC_PLAUSIBLE_SCRIPT;
  return Boolean(domain && script);
}

/**
 * Get Plausible configuration
 */
export function getPlausibleConfig() {
  return {
    domain: clientEnv.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    script: clientEnv.NEXT_PUBLIC_PLAUSIBLE_SCRIPT,
    enabled: isPlausibleEnabled(),
  };
}

/**
 * Check if Umami is enabled
 */
export function isUmamiEnabled(): boolean {
  const websiteId = clientEnv.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const script = clientEnv.NEXT_PUBLIC_UMAMI_SCRIPT;
  return Boolean(websiteId && script);
}

/**
 * Get Umami configuration
 */
export function getUmamiConfig() {
  return {
    websiteId: clientEnv.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    script: clientEnv.NEXT_PUBLIC_UMAMI_SCRIPT,
    enabled: isUmamiEnabled(),
  };
}

/**
 * Check if Clarity is enabled
 */
export function isClarityEnabled(): boolean {
  const projectId = clientEnv.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  return Boolean(projectId);
}

/**
 * Get Clarity configuration
 */
export function getClarityConfig() {
  return {
    projectId: clientEnv.NEXT_PUBLIC_CLARITY_PROJECT_ID,
    enabled: isClarityEnabled(),
  };
}

/**
 * Check if Ahrefs is enabled
 */
export function isAhrefsEnabled(): boolean {
  const websiteId = clientEnv.NEXT_PUBLIC_AHREFS_WEBSITE_ID;
  return Boolean(websiteId);
}

/**
 * Get Ahrefs configuration
 */
export function getAhrefsConfig() {
  return {
    websiteId: clientEnv.NEXT_PUBLIC_AHREFS_WEBSITE_ID,
    enabled: isAhrefsEnabled(),
  };
}

/**
 * Check if Seline is enabled
 */
export function isSelineEnabled(): boolean {
  const token = clientEnv.NEXT_PUBLIC_SELINE_TOKEN;
  return Boolean(token);
}

/**
 * Get Seline configuration
 */
export function getSelineConfig() {
  return {
    token: clientEnv.NEXT_PUBLIC_SELINE_TOKEN,
    enabled: isSelineEnabled(),
  };
}

/**
 * Check if DataFast is enabled
 */
export function isDataFastEnabled(): boolean {
  const domain = clientEnv.NEXT_PUBLIC_DATAFAST_DOMAIN;
  const websiteId = clientEnv.NEXT_PUBLIC_DATAFAST_WEBSITE_ID;
  return Boolean(domain && websiteId);
}

/**
 * Get DataFast configuration
 */
export function getDataFastConfig() {
  return {
    domain: clientEnv.NEXT_PUBLIC_DATAFAST_DOMAIN,
    websiteId: clientEnv.NEXT_PUBLIC_DATAFAST_WEBSITE_ID,
    enabled: isDataFastEnabled(),
  };
}

/**
 * Check if Vercel Analytics is enabled
 */
export function isVercelAnalyticsEnabled(): boolean {
  return websiteConfig.analytics.enableVercelAnalytics ?? false;
}

/**
 * Check if Speed Insights is enabled
 */
export function isSpeedInsightsEnabled(): boolean {
  return websiteConfig.analytics.enableSpeedInsights ?? false;
}

/**
 * Get all analytics configuration status
 */
export function getAnalyticsStatus() {
  return {
    posthog: isPostHogEnabled(),
    openpanel: isOpenPanelEnabled(),
    google: isGoogleAnalyticsEnabled(),
    plausible: isPlausibleEnabled(),
    umami: isUmamiEnabled(),
    clarity: isClarityEnabled(),
    ahrefs: isAhrefsEnabled(),
    seline: isSelineEnabled(),
    datafast: isDataFastEnabled(),
    vercel: isVercelAnalyticsEnabled(),
    speedInsights: isSpeedInsightsEnabled(),
  };
}
