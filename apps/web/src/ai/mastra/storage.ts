import 'server-only';

import { PostgresStore } from '@mastra/pg';
import { serverEnv } from '@repo/env/server';

export interface MastraStorageConfig {
  readonly id: string;
  readonly connectionString: string;
  readonly schemaName?: string;
  readonly max?: number;
  readonly idleTimeoutMillis?: number;
  readonly disableInit?: boolean;
  readonly skipDefaultIndexes?: boolean;
}

export function resolveMastraStorageConfig(): MastraStorageConfig {
  const databaseUrl = serverEnv.DATABASE_URL;

  return {
    id: 'aelokit-mastra-storage',
    connectionString: databaseUrl,
    schemaName: 'mastra',
    max: 10,
    idleTimeoutMillis: 30000,
    disableInit: false,
    skipDefaultIndexes: false,
  };
}

export function createMastraStorage(
  config: MastraStorageConfig
): PostgresStore {
  return new PostgresStore({
    id: config.id,
    connectionString: config.connectionString,
    schemaName: config.schemaName,
    max: config.max,
    idleTimeoutMillis: config.idleTimeoutMillis,
    disableInit: config.disableInit,
    skipDefaultIndexes: config.skipDefaultIndexes,
  });
}

export function getMastraStorage(): PostgresStore {
  const config = resolveMastraStorageConfig();
  return createMastraStorage(config);
}

export const PARTIAL_UNTIL_WIRED = false;
