import 'server-only';

import type { ToolSet } from 'ai';
import type { AIToolRegistryEntry } from '@repo/ai/tools';
import {
  createKnowledgeInspectionTool,
  KNOWLEDGE_INSPECTION_TOOL_ID,
  KNOWLEDGE_INSPECTION_TOOL_NAME,
} from './knowledge-inspection';
import { decideToolPermission } from './permissions';
import type { AIPermissionDecision } from '@repo/ai/permissions';

export interface CreateMastraToolRegistryOptions {
  readonly userId: string;
  readonly knowledgeEnabled: boolean;
  readonly toolsAllowed: boolean;
  readonly allowedToolIds?: readonly string[];
}

export interface MastraToolRegistry {
  readonly tools: ToolSet;
  readonly definitions: readonly AIToolRegistryEntry[];
  readonly permissionDecisions: readonly AIPermissionDecision[];
}

export function createMastraToolRegistry(
  options: CreateMastraToolRegistryOptions
): MastraToolRegistry {
  const knowledgeToolPermission = decideToolPermission({
    userId: options.userId,
    toolId: KNOWLEDGE_INSPECTION_TOOL_ID,
    toolsAllowed: options.knowledgeEnabled && options.toolsAllowed,
    agentAllowedToolIds: options.allowedToolIds,
    requiredScope: 'knowledge:read',
    action: 'read',
    resourceType: 'knowledge',
  });
  const allowKnowledgeTool =
    options.knowledgeEnabled && knowledgeToolPermission.outcome === 'allow';

  if (!allowKnowledgeTool) {
    return {
      tools: {},
      definitions: [],
      permissionDecisions: [knowledgeToolPermission],
    };
  }

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
    permissionDecisions: [knowledgeToolPermission],
  };
}

export function getToolIdByName(
  registry: MastraToolRegistry,
  toolName: string
): string | undefined {
  return registry.definitions.find((definition) => definition.name === toolName)
    ?.id;
}

export function getToolDefinitionByName(
  registry: MastraToolRegistry,
  toolName: string
): AIToolRegistryEntry | undefined {
  return registry.definitions.find(
    (definition) => definition.name === toolName
  );
}

export function getToolPermissionDecisionByName(
  registry: MastraToolRegistry,
  toolName: string
): AIPermissionDecision | undefined {
  const toolId = getToolIdByName(registry, toolName);
  return registry.permissionDecisions.find(
    (decision) => decision.request.resource.id === toolId
  );
}
