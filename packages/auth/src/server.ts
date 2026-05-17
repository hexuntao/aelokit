import { websiteConfig } from '@repo/config';
import { getDb } from '@repo/db';
import { serverEnv } from '@repo/env/server';
import type { User } from 'better-auth';
import { betterAuth } from 'better-auth';
import { emailHarmony } from 'better-auth-harmony';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, apiKey } from 'better-auth/plugins';
import { getBaseUrl } from './utils';

/**
 * Options for app-specific auth callbacks
 *
 * These callbacks depend on app-layer modules (mail, i18n, credits, newsletter)
 * that are not available in the shared auth package.
 * The app layer must provide these when creating the auth instance.
 */
export interface AuthAppCallbacks {
  /**
   * Called after a new user is created.
   * Use this to handle newsletter subscription, register gift credits, and monthly free credits.
   */
  onUserCreate?: (user: User) => Promise<void>;

  /**
   * Send a reset password email.
   * Receives the user, the reset URL, and the original request.
   */
  sendResetPassword?: (
    user: User,
    url: string,
    request: Request | undefined
  ) => Promise<void>;

  /**
   * Send a verification email.
   * Receives the user, the verification URL, the token, and the original request.
   */
  sendVerificationEmail?: (
    user: User,
    url: string,
    token: string,
    request: Request | undefined
  ) => Promise<void>;
}

/**
 * Create a Better Auth instance with app-specific callbacks
 *
 * docs:
 * https://example.com/docs/auth
 * https://www.better-auth.com/docs/reference/options
 *
 * @param callbacks - App-specific callbacks for email sending and user creation hooks
 * @returns Better Auth instance
 */
export async function createAuth(callbacks?: AuthAppCallbacks) {
  const db = await getDb();

  return betterAuth({
    baseURL: getBaseUrl(),
    appName: 'AeloKit',
    database: drizzleAdapter(db, {
      provider: 'pg', // or "mysql", "sqlite"
    }),
    session: {
      // https://www.better-auth.com/docs/concepts/session-management#cookie-cache
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60, // Cache duration in seconds
      },
      // https://www.better-auth.com/docs/concepts/session-management#session-expiration
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      // https://www.better-auth.com/docs/concepts/session-management#session-freshness
      // https://www.better-auth.com/docs/concepts/users-accounts#authentication-requirements
      // disable freshness check for user deletion
      freshAge: 0 /* 60 * 60 * 24 */,
    },
    emailAndPassword: {
      // https://discord.com/channels/1300839113142046730/1300839113594769431/1454280549060444393
      enabled: websiteConfig.auth.enableCredentialLogin ?? false,
      // https://www.better-auth.com/docs/concepts/email#2-require-email-verification
      requireEmailVerification: true,
      // https://www.better-auth.com/docs/authentication/email-password#forget-password
      async sendResetPassword({ user, url }, request) {
        await callbacks?.sendResetPassword?.(user, url, request);
      },
    },
    emailVerification: {
      // https://www.better-auth.com/docs/concepts/email#auto-signin-after-verification
      autoSignInAfterVerification: true,
      // https://www.better-auth.com/docs/authentication/email-password#require-email-verification
      sendVerificationEmail: async ({ user, url, token }, request) => {
        await callbacks?.sendVerificationEmail?.(user, url, token, request);
      },
    },
    socialProviders: {
      // https://www.better-auth.com/docs/authentication/github
      github: {
        clientId: serverEnv.GITHUB_CLIENT_ID!,
        clientSecret: serverEnv.GITHUB_CLIENT_SECRET!,
      },
      // https://www.better-auth.com/docs/authentication/google
      google: {
        clientId: serverEnv.GOOGLE_CLIENT_ID!,
        clientSecret: serverEnv.GOOGLE_CLIENT_SECRET!,
      },
    },
    account: {
      // https://www.better-auth.com/docs/concepts/users-accounts#account-linking
      accountLinking: {
        enabled: true,
        trustedProviders: ['google', 'github'],
      },
    },
    user: {
      // https://www.better-auth.com/docs/concepts/database#extending-core-schema
      additionalFields: {
        customerId: {
          type: 'string',
          required: false,
        },
      },
      // https://www.better-auth.com/docs/concepts/users-accounts#delete-user
      deleteUser: {
        enabled: websiteConfig.auth.enableDeleteUser ?? false,
      },
    },
    databaseHooks: {
      // https://www.better-auth.com/docs/concepts/database#database-hooks
      user: {
        create: {
          after: async (user) => {
            await callbacks?.onUserCreate?.(user);
          },
        },
      },
    },
    plugins: [
      // https://www.better-auth.com/docs/plugins/admin
      // support user management, ban/unban user, manage user roles, etc.
      admin({
        // https://www.better-auth.com/docs/plugins/admin#default-ban-reason
        // defaultBanReason: 'Spamming',
        defaultBanExpiresIn: undefined,
        bannedUserMessage:
          'You have been banned from this application. Please contact support if you believe this is an error.',
      }),
      // https://www.better-auth.com/docs/plugins/api-key
      // support API key management for user authentication
      apiKey(),
      // https://github.com/gekorm/better-auth-harmony
      // Email normalization and validation to prevent duplicate registrations
      emailHarmony({
        // Don't allow login with any version of the unnormalized email address
        // e.g., user signed up with johndoe@googlemail.com can't login with john.doe@gmail.com
        // e.g., user signed up with johndoe@googlemail.com can't login with johndoe+abc@gmail.com
        allowNormalizedSignin: false,
      }),
    ],
    onAPIError: {
      // https://www.better-auth.com/docs/reference/options#onapierror
      errorURL: '/auth/error',
      onError: (error, ctx) => {
        console.error('auth error:', error);
      },
    },
  });
}

export const auth = await createAuth();
