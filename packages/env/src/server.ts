import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';
import { loadWorkspaceEnv } from './load';
import { optionalBooleanString, optionalString, optionalUrl } from './utils';

loadWorkspaceEnv();

export const serverEnv = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),

    // OAuth - GitHub
    GITHUB_CLIENT_ID: optionalString,
    GITHUB_CLIENT_SECRET: optionalString,
    // OAuth - Google
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,

    // Email (Resend)
    RESEND_API_KEY: optionalString,

    // Newsletter (Beehiiv)
    BEEHIIV_API_KEY: optionalString,
    BEEHIIV_PUBLICATION_ID: optionalString,

    // Storage (Cloudflare R2 / S3-compatible)
    STORAGE_REGION: z.string().default('auto'),
    STORAGE_BUCKET_NAME: optionalString,
    STORAGE_ACCESS_KEY_ID: optionalString,
    STORAGE_SECRET_ACCESS_KEY: optionalString,
    STORAGE_ENDPOINT: optionalUrl,
    STORAGE_PUBLIC_URL: optionalUrl,

    // Payment - Stripe
    STRIPE_SECRET_KEY: optionalString,
    STRIPE_WEBHOOK_SECRET: optionalString,
    // Payment - Creem
    CREEM_API_KEY: optionalString,
    CREEM_TEST_MODE: optionalBooleanString,

    // Configurations
    DISABLE_IMAGE_OPTIMIZATION: optionalBooleanString,

    // Notification - Discord
    DISCORD_WEBHOOK_URL: optionalUrl,
    // Notification - Feishu
    FEISHU_WEBHOOK_URL: optionalUrl,

    // Captcha (Cloudflare Turnstile)
    TURNSTILE_SECRET_KEY: optionalString,

    // Cron Jobs
    CRON_JOBS_USERNAME: optionalString,
    CRON_JOBS_PASSWORD: optionalString,

    // AI Providers
    AI_GATEWAY_API_KEY: optionalString,
    FAL_API_KEY: optionalString,
    FIREWORKS_API_KEY: optionalString,
    OPENAI_API_KEY: optionalString,
    OPENAI_BASE_URL: optionalUrl,
    REPLICATE_API_TOKEN: optionalString,
    GOOGLE_GENERATIVE_AI_API_KEY: optionalString,
    DEEPSEEK_API_KEY: optionalString,
    OPENROUTER_API_KEY: optionalString,

    // AI Usage / Credits Billing
    AI_CREDITS_BILLING_ENABLED: optionalBooleanString,

    // AI Embedding Provider (for Knowledge/RAG)
    AI_EMBEDDING_PROVIDER: optionalString.default('openai'),
    AI_EMBEDDING_MODEL: optionalString.default('text-embedding-3-small'),
    AI_EMBEDDING_API_KEY: optionalString,
    AI_EMBEDDING_BASE_URL: optionalUrl,

    // Web Content Analyzer (Firecrawl)
    FIRECRAWL_API_KEY: optionalString,

    // Analytics - PostHog Server-side
    POSTHOG_API_KEY: optionalString,
  },
  experimental__runtimeEnv: process.env,
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',
});
