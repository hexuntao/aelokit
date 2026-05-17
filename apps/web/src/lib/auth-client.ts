import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { authClientPlugins } from '@repo/auth/client';
import { getBaseUrl } from '@repo/auth/utils';
import type { auth } from './auth';

/**
 * https://www.better-auth.com/docs/installation#create-client-instance
 */
export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    ...authClientPlugins,
    // https://www.better-auth.com/docs/concepts/typescript#inferring-additional-fields-on-client
    inferAdditionalFields<typeof auth>(),
  ],
});
