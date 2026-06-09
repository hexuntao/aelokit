import 'server-only';

import {
  formatRetrievalContextForPrompt,
  retrieveKnowledgeContext,
} from '../knowledge';
import { getMemoryContextForChat } from '../memory';
import {
  buildMastraAgentContextCore,
  type BuildMastraAgentContextOptions,
  type MastraAgentContextResult,
} from './context-core';

export type { BuildMastraAgentContextOptions, MastraAgentContextResult };

export async function buildMastraAgentContext(
  options: BuildMastraAgentContextOptions
): Promise<MastraAgentContextResult> {
  return buildMastraAgentContextCore(options, {
    recallMemory: getMemoryContextForChat,
    retrieveKnowledge: retrieveKnowledgeContext,
    formatKnowledgeContext: formatRetrievalContextForPrompt,
  });
}
