import type { AIRuntimeContext } from '../context';

export interface EntitlementCheckResult {
  readonly allowed: boolean;
  readonly reason?: string;
}

export interface AIEntitlementRequest {
  readonly requestedModelId?: string;
  readonly allowedModelIds: readonly string[];
  readonly knowledgeEnabled: boolean;
  readonly knowledgeAvailable: boolean;
  readonly memoryEnabled: boolean;
  readonly toolsRequested: number;
  readonly toolsAllowed: boolean;
  readonly memoryAvailable?: boolean;
  readonly maxCreditsPerRequest?: number | null;
  readonly creditsBillingEnabled: boolean;
  readonly creditsRequired: number;
  readonly currentCredits?: number;
}

export interface AIEntitlementPolicy {
  canChat(
    context: AIRuntimeContext,
    request: AIEntitlementRequest
  ): EntitlementCheckResult;
  canUseModel(
    context: AIRuntimeContext,
    request: AIEntitlementRequest
  ): EntitlementCheckResult;
  canUseKnowledge(
    context: AIRuntimeContext,
    request: AIEntitlementRequest
  ): EntitlementCheckResult;
  canUseMemory(
    context: AIRuntimeContext,
    request: AIEntitlementRequest
  ): EntitlementCheckResult;
  canUseTools(
    context: AIRuntimeContext,
    request: AIEntitlementRequest
  ): EntitlementCheckResult;
  canUseCredits(
    context: AIRuntimeContext,
    request: AIEntitlementRequest
  ): EntitlementCheckResult;
}

export interface EntitlementDecision {
  readonly allowed: boolean;
  readonly checks: Readonly<Record<string, EntitlementCheckResult>>;
  readonly error?: {
    readonly code: 'forbidden' | 'unauthenticated' | 'payment_required';
    readonly message: string;
  };
}

export const DefaultEntitlementPolicy: AIEntitlementPolicy = {
  canChat: (context): EntitlementCheckResult => {
    if (!context.userId || !context.session.user) {
      return {
        allowed: false,
        reason: 'Unauthenticated user cannot access AI chat.',
      };
    }

    return { allowed: true };
  },

  canUseModel: (_context, request): EntitlementCheckResult => {
    if (!request.requestedModelId) {
      return { allowed: true };
    }

    if (request.allowedModelIds.includes(request.requestedModelId)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Selected model "${request.requestedModelId}" is not allowed.`,
    };
  },

  canUseKnowledge: (_context, request): EntitlementCheckResult => {
    if (!request.knowledgeEnabled) {
      return { allowed: true };
    }

    if (request.knowledgeAvailable) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Knowledge retrieval is not available for this request.',
    };
  },

  canUseMemory: (_context, request): EntitlementCheckResult => {
    if (!request.memoryEnabled) {
      return { allowed: true };
    }

    if (request.memoryAvailable === false) {
      return {
        allowed: false,
        reason: 'Memory is not enabled for this plan.',
      };
    }

    return { allowed: true };
  },

  canUseTools: (_context, request): EntitlementCheckResult => {
    if (request.toolsRequested === 0) {
      return { allowed: true };
    }

    if (request.toolsAllowed) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Tool usage is not allowed for this request.',
    };
  },

  canUseCredits: (_context, request): EntitlementCheckResult => {
    if (!request.creditsBillingEnabled) {
      return { allowed: true };
    }

    if (
      request.maxCreditsPerRequest !== undefined &&
      request.maxCreditsPerRequest !== null &&
      request.creditsRequired > request.maxCreditsPerRequest
    ) {
      return {
        allowed: false,
        reason: `AI request requires ${request.creditsRequired} credits, above the plan limit of ${request.maxCreditsPerRequest}.`,
      };
    }

    if (request.currentCredits === undefined) {
      return {
        allowed: false,
        reason: 'Credits balance is required when AI billing is enabled.',
      };
    }

    if (request.currentCredits >= request.creditsRequired) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Insufficient credits. Required ${request.creditsRequired}, current balance ${request.currentCredits}.`,
    };
  },
};

function toDecisionError(
  context: AIRuntimeContext,
  checkName: keyof EntitlementDecision['checks'],
  reason: string
): EntitlementDecision['error'] {
  if (!context.userId || !context.session.user) {
    return {
      code: 'unauthenticated',
      message: reason,
    };
  }

  if (checkName === 'credits') {
    return {
      code: 'payment_required',
      message: reason,
    };
  }

  return {
    code: 'forbidden',
    message: reason,
  };
}

export function enforceEntitlement(
  context: AIRuntimeContext,
  request: AIEntitlementRequest,
  policy: AIEntitlementPolicy = DefaultEntitlementPolicy
): EntitlementDecision {
  const checks = {
    chat: policy.canChat(context, request),
    model: policy.canUseModel(context, request),
    knowledge: policy.canUseKnowledge(context, request),
    memory: policy.canUseMemory(context, request),
    tools: policy.canUseTools(context, request),
    credits: policy.canUseCredits(context, request),
  } as const;

  for (const [checkName, check] of Object.entries(checks)) {
    if (!check.allowed) {
      return {
        allowed: false,
        checks,
        error: toDecisionError(
          context,
          checkName as keyof typeof checks,
          check.reason ?? 'Access denied.'
        ),
      };
    }
  }

  return {
    allowed: true,
    checks,
  };
}

export { DefaultEntitlementPolicy as entitlementPolicy };
