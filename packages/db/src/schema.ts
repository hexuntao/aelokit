import * as authSchema from './auth.schema';
import * as appSchema from './app.schema';
import * as aiSchema from './ai.schema';
import * as knowledgeSchema from './knowledge.schema';

/**
 * Re-export all tables so drizzle-kit can discover them when reading this file.
 * https://orm.drizzle.team/docs/drizzle-kit-generate
 */
export * from './auth.schema';
export * from './app.schema';
export * from './ai.schema';
export * from './knowledge.schema';

export const schema = {
  ...authSchema,
  ...appSchema,
  ...aiSchema,
  ...knowledgeSchema,
} as const;
