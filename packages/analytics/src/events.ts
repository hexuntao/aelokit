/**
 * Analytics event names
 *
 * Common event names used across the application.
 * These are constants to ensure consistency when tracking events.
 */

/**
 * Authentication events
 */
export const AUTH_EVENTS = {
  SIGN_IN: 'auth_sign_in',
  SIGN_UP: 'auth_sign_up',
  SIGN_OUT: 'auth_sign_out',
  PASSWORD_RESET: 'auth_password_reset',
  EMAIL_VERIFIED: 'auth_email_verified',
} as const;

/**
 * Payment events
 */
export const PAYMENT_EVENTS = {
  CHECKOUT_CREATED: 'payment_checkout_created',
  CHECKOUT_COMPLETED: 'payment_checkout_completed',
  SUBSCRIPTION_CREATED: 'payment_subscription_created',
  SUBSCRIPTION_CANCELLED: 'payment_subscription_cancelled',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  PAYMENT_FAILED: 'payment_failed',
} as const;

/**
 * Credits events
 */
export const CREDITS_EVENTS = {
  CONSUMED: 'credits_consumed',
  PURCHASED: 'credits_purchased',
  EXPIRED: 'credits_expired',
  GIFTED: 'credits_gifted',
} as const;

/**
 * Newsletter events
 */
export const NEWSLETTER_EVENTS = {
  SUBSCRIBED: 'newsletter_subscribed',
  UNSUBSCRIBED: 'newsletter_unsubscribed',
} as const;

/**
 * Storage events
 */
export const STORAGE_EVENTS = {
  FILE_UPLOADED: 'storage_file_uploaded',
  FILE_DELETED: 'storage_file_deleted',
} as const;

/**
 * All analytics events
 */
export const AnalyticsEvents = {
  ...AUTH_EVENTS,
  ...PAYMENT_EVENTS,
  ...CREDITS_EVENTS,
  ...NEWSLETTER_EVENTS,
  ...STORAGE_EVENTS,
} as const;

export type AnalyticsEventKey = keyof typeof AnalyticsEvents;
