import 'server-only';

export * from './storage';
export * from './memory';
export * from './config';
export * from './instance';
export * from './runner';

export const PARTIAL_UNTIL_WIRED = false;

export const MASTRA_SKELETON_STATUS =
  'WIRED_FOR_AGENT_CORE_MEMORY_KNOWLEDGE' as const;

export const MASTRA_SKELETON_NOTE =
  'Mastra storage, memory, vector wiring, and the app-local chat Agent ' +
  'factory are wired for /api/ai/chat. Streaming remains AI SDK-compatible ' +
  'through the current route contract.';
