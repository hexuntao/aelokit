import 'server-only';

import { Mastra } from '@mastra/core';
import type { PostgresStore } from '@mastra/pg';
import type { Memory } from '@mastra/memory';
import type { MastraRuntimeConfig } from './config';

export function createMastraInstance(config: MastraRuntimeConfig): Mastra {
  return new Mastra({
    storage: config.storage,
  });
}

let mastraInstance: Mastra | null = null;

export function getMastraInstance(config: MastraRuntimeConfig): Mastra {
  if (!mastraInstance) {
    mastraInstance = createMastraInstance(config);
  }
  return mastraInstance;
}

export function resetMastraInstance(): void {
  mastraInstance = null;
}

export const PARTIAL_UNTIL_WIRED = false;
