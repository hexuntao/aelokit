import 'server-only';

export * from './storage';
export * from './memory';
export * from './config';
export * from './instance';

export const PARTIAL_UNTIL_WIRED = true;

export const MASTRA_SKELETON_STATUS = 'PARTIAL_UNTIL_WIRED' as const;

export const MASTRA_SKELETON_NOTE =
  'This Mastra runtime skeleton provides factory functions and config resolvers only. ' +
  'No live runtime execution or route integration. ' +
  'Must be explicitly wired by later TASKs before production use.';
