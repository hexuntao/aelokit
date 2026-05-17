import { adminClient, apiKeyClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { getBaseUrl } from './utils';

/**
 * Auth client plugins configuration
 *
 * Use these plugins when creating the auth client in the app layer
 * with `inferAdditionalFields<typeof auth>()` for full type inference.
 *
 * https://www.better-auth.com/docs/installation#create-client-instance
 */
export const authClientPlugins = [
  // https://www.better-auth.com/docs/plugins/admin#add-the-client-plugin
  adminClient(),
  // https://www.better-auth.com/docs/plugins/api-key#add-the-client-plugin
  apiKeyClient(),
] as const;

/**
 * Default auth client instance without additional field type inference.
 *
 * For full type inference including additional fields, create the client
 * in the app layer using `createAuthClient` and `authClientPlugins` from this package,
 * plus `inferAdditionalFields<typeof auth>()` from `better-auth/client/plugins`.
 *
 * https://www.better-auth.com/docs/installation#create-client-instance
 */
export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [...authClientPlugins],
});
