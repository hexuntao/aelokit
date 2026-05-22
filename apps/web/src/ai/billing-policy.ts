import type { AIUsageBillingMode, AIUsageBillingStatus } from '@repo/ai/usage';

export function getAIUsageBillingMode(
  creditsBillingEnabled: boolean
): AIUsageBillingMode {
  return creditsBillingEnabled ? 'credits' : 'audit_only';
}

export function getInitialAIUsageBillingStatus(
  creditsBillingEnabled: boolean
): AIUsageBillingStatus {
  return creditsBillingEnabled ? 'preflight_passed' : 'audit_only';
}

export function shouldRunAICreditsBilling(
  creditsBillingEnabled: boolean
): boolean {
  return getAIUsageBillingMode(creditsBillingEnabled) === 'credits';
}
