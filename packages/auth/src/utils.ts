import { clientEnv } from '@repo/env/client';

/**
 * Get the base URL of the application
 */
export function getBaseUrl(): string {
  return clientEnv.NEXT_PUBLIC_BASE_URL ?? `http://localhost:3000`;
}
