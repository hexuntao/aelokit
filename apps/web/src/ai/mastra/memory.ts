import 'server-only';

import { Memory } from '@mastra/memory';
import type { PostgresStore } from '@mastra/pg';

export interface MastraMemoryConfig {
  readonly storage: PostgresStore;
  readonly lastMessages?: number;
  readonly generateTitle?: boolean;
  readonly semanticRecall?: boolean;
}

export function resolveMastraMemoryConfig(
  storage: PostgresStore
): MastraMemoryConfig {
  return {
    storage,
    lastMessages: 20,
    generateTitle: true,
    semanticRecall: false,
  };
}

export function createMastraMemory(config: MastraMemoryConfig): Memory {
  return new Memory({
    storage: config.storage,
    options: {
      lastMessages: config.lastMessages,
      generateTitle: config.generateTitle,
      semanticRecall: config.semanticRecall,
    },
  });
}

export function getMastraMemory(storage: PostgresStore): Memory {
  const config = resolveMastraMemoryConfig(storage);
  return createMastraMemory(config);
}

export const PARTIAL_UNTIL_WIRED = true;
