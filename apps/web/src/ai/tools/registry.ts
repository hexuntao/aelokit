import 'server-only';

import type { ToolSet } from 'ai';
import type { AIToolRegistryEntry } from '@repo/ai/tools';
import {
  createKnowledgeInspectionTool,
  KNOWLEDGE_INSPECTION_TOOL_ID,
  KNOWLEDGE_INSPECTION_TOOL_NAME,
} from './knowledge-inspection';

export interface CreateMastraToolRegistryOptions {
  readonly userId: string;
}

export interface MastraToolRegistry {
  readonly tools: ToolSet;
  readonly definitions: readonly AIToolRegistryEntry[];
}

export function createMastraToolRegistry(
  options: CreateMastraToolRegistryOptions
): MastraToolRegistry {
  return {
    tools: {
      [KNOWLEDGE_INSPECTION_TOOL_NAME]: createKnowledgeInspectionTool({
        userId: options.userId,
      }),
    },
    definitions: [
      {
        id: KNOWLEDGE_INSPECTION_TOOL_ID,
        name: KNOWLEDGE_INSPECTION_TOOL_NAME,
        display: {
          name: 'Inspect knowledge',
          description: 'Read-only inspection of accessible knowledge metadata.',
        },
        capabilities: ['read', 'retrieve'],
        input: {
          description:
            'Optional source, document, or chunk scope plus a result limit.',
          contentType: 'application/json',
        },
        output: {
          description:
            'Accessible source, document, chunk, and citation metadata only.',
          contentType: 'application/json',
        },
        permissions: [
          {
            scope: 'knowledge:read',
            resourceKind: 'knowledge-source',
            mode: 'read',
          },
        ],
        schemaValidation: {
          input: 'runtime',
          output: 'runtime',
        },
        mcp: {
          compatible: true,
          name: 'knowledge.inspect',
        },
      },
    ],
  };
}

export function getToolIdByName(
  registry: MastraToolRegistry,
  toolName: string
): string | undefined {
  return registry.definitions.find((definition) => definition.name === toolName)
    ?.id;
}
