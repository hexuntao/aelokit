import 'server-only';

export * from './storage';
export * from './memory';
export * from './config';
export * from './instance';

export const PARTIAL_UNTIL_WIRED = false;

export const MASTRA_SKELETON_STATUS =
  'WIRED_FOR_V0_3_MEMORY_KNOWLEDGE' as const;

export const MASTRA_SKELETON_NOTE =
  'Mastra storage, memory, and vector wiring are used by the app-local v0.3 ' +
  'memory/knowledge services. Mastra Agent/workflow runtime remains out of scope.';
