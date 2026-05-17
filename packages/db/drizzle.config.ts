import { defineConfig } from 'drizzle-kit';
import { serverEnv } from '@repo/env/server';

/**
 * https://orm.drizzle.team/docs/get-started/neon-new#step-5---setup-drizzle-config-file
 */
export default defineConfig({
  out: './src/migrations',
  schema: './src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: serverEnv.DATABASE_URL,
  },
});
