/**
 * @repo/analytics
 *
 * Analytics domain package for the monorepo.
 *
 * This package provides:
 * - Analytics types and interfaces
 * - Provider configuration helpers
 * - Client-safe analytics helpers
 * - Server-safe analytics helpers
 * - Event name constants
 * - Provider registry
 *
 * IMPORTANT:
 * - React Provider components remain in apps/web
 * - Script injection components remain in apps/web
 * - Next.js layout integration remains in apps/web
 * - This package does not depend on React, Next.js, or other domain packages
 */

export * from './types';
export * from './client';
export * from './server';
export * from './events';
export * from './provider';
export * from './registry';
export * from './config';
export * from './helpers';
