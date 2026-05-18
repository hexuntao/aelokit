import 'server-only';

import type { AIRuntimeContext } from '../context';

export interface EntitlementCheckResult {
  readonly allowed: boolean;
  readonly reason?: string;
}

export interface AIEntitlementPolicy {
  canChat(context: AIRuntimeContext): EntitlementCheckResult;
  canStream(context: AIRuntimeContext): EntitlementCheckResult;
}

export const DefaultEntitlementPolicy: AIEntitlementPolicy = {
  canChat: (context: AIRuntimeContext): EntitlementCheckResult => {
    // v0.2: 最小 entitlement，只检查用户已认证
    if (!context.userId || !context.session.user) {
      return {
        allowed: false,
        reason: 'Unauthenticated user cannot access AI chat.',
      };
    }

    // 可以在 v0.3+ 扩展为更复杂的权限检查
    return { allowed: true };
  },

  canStream: (context: AIRuntimeContext): EntitlementCheckResult => {
    // v0.2: 最小 entitlement，与 canChat 保持一致
    return DefaultEntitlementPolicy.canChat(context);
  },
};

export function enforceEntitlement(
  context: AIRuntimeContext,
  policy: AIEntitlementPolicy = DefaultEntitlementPolicy
):
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly error: {
        readonly code: 'forbidden' | 'unauthenticated';
        readonly message: string;
      };
    } {
  const check = policy.canChat(context);
  if (check.allowed) {
    return { allowed: true };
  }

  // 确定是 unauthenticated 还是 forbidden
  const isUnauthenticated = !context.userId || !context.session.user;
  return {
    allowed: false,
    error: {
      code: isUnauthenticated ? 'unauthenticated' : 'forbidden',
      message: check.reason ?? 'Access denied.',
    },
  };
}

export { DefaultEntitlementPolicy as entitlementPolicy };
