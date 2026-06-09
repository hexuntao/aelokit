import type {
  AIPermissionDecision,
  AIPermissionReasonCode,
} from '@repo/ai/permissions';

export interface ToolPermissionDecisionInput {
  readonly userId: string;
  readonly toolId: string;
  readonly toolsAllowed: boolean;
  readonly agentAllowedToolIds?: readonly string[];
  readonly requiredScope: string;
  readonly action: 'read' | 'execute';
  readonly resourceType?: 'knowledge' | 'tool' | 'mcp-tool';
}

function createDecisionId(toolId: string, userId: string): string {
  return `tool-permission:${toolId}:${userId}`;
}

function createReason(
  code: AIPermissionReasonCode,
  message: string
): AIPermissionDecision['reason'] {
  return {
    code,
    message,
  };
}

export function decideToolPermission(
  input: ToolPermissionDecisionInput
): AIPermissionDecision {
  const request = {
    subject: {
      type: 'user' as const,
      id: input.userId,
    },
    resource: {
      type: input.resourceType ?? ('tool' as const),
      id: input.toolId,
    },
    action: input.action,
  };

  if (!input.toolsAllowed) {
    return {
      id: createDecisionId(input.toolId, input.userId),
      outcome: 'deny',
      request,
      reason: createReason(
        'resource-disabled',
        'Tool execution is disabled by the active plan or agent policy.'
      ),
      decidedAt: new Date().toISOString(),
    };
  }

  if (
    input.agentAllowedToolIds &&
    !input.agentAllowedToolIds.includes(input.toolId)
  ) {
    return {
      id: createDecisionId(input.toolId, input.userId),
      outcome: 'deny',
      request,
      reason: createReason(
        'missing-permission',
        'The selected agent is not allowed to use this tool.'
      ),
      decidedAt: new Date().toISOString(),
    };
  }

  return {
    id: createDecisionId(input.toolId, input.userId),
    outcome: 'allow',
    request,
    reason: createReason(
      'allowed-by-policy',
      `Allowed by app-local ${input.requiredScope} policy.`
    ),
    decidedAt: new Date().toISOString(),
  };
}

export function toSafePermissionDecisionMetadata(
  decision: AIPermissionDecision | undefined
): Record<string, unknown> | undefined {
  if (!decision) {
    return undefined;
  }

  return {
    id: decision.id,
    outcome: decision.outcome,
    subjectType: decision.request.subject.type,
    resourceType: decision.request.resource.type,
    resourceId: decision.request.resource.id,
    action: decision.request.action,
    reasonCode: decision.reason.code,
    reasonMessage: decision.reason.message,
    decidedAt: decision.decidedAt,
  };
}
