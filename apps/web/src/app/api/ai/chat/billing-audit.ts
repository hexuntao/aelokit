import type { AIUsageBillingStatus } from '@repo/ai/usage';

type AIChatRefundStatus =
  | 'not_required'
  | 'refunded'
  | 'refund_failed'
  | 'no_charge'
  | 'cancelled';

export type AIChatBillingAction =
  | 'audit_only'
  | 'settled'
  | 'released'
  | 'refunded'
  | 'refund_failed'
  | 'no_charge';

export function resolveAIChatRefundOutcome(
  refundStatus: AIChatRefundStatus | undefined
): {
  readonly billingStatus: AIUsageBillingStatus;
  readonly billingAction: AIChatBillingAction;
} {
  if (refundStatus === 'refunded') {
    return {
      billingStatus: 'refunded',
      billingAction: 'refunded',
    };
  }

  if (refundStatus === 'cancelled' || refundStatus === 'no_charge') {
    return {
      billingStatus: 'no_charge',
      billingAction: 'released',
    };
  }

  return {
    billingStatus: 'no_charge',
    billingAction: 'no_charge',
  };
}

export function resolveAIChatRouteErrorBillingOutcome(options: {
  readonly creditsBillingEnabled: boolean;
  readonly hasReservation: boolean;
  readonly refundSucceeded?: boolean;
  readonly refundStatus?: AIChatRefundStatus;
}): {
  readonly billingStatus: AIUsageBillingStatus;
  readonly billingAction: AIChatBillingAction;
} {
  if (!options.creditsBillingEnabled) {
    return {
      billingStatus: 'audit_only',
      billingAction: 'audit_only',
    };
  }

  if (!options.hasReservation) {
    return {
      billingStatus: 'no_charge',
      billingAction: 'no_charge',
    };
  }

  if (!options.refundSucceeded) {
    return {
      billingStatus: 'refund_failed',
      billingAction: 'refund_failed',
    };
  }

  return resolveAIChatRefundOutcome(options.refundStatus);
}

export function getAIChatBillingReference(options: {
  usageId: string;
  reservationId?: string;
  reservedCredits?: number;
  estimatedCredits?: number;
  settledCredits?: number;
  releasedCredits?: number;
  refundedCredits?: number;
  overageCredits?: number;
  settlementError?: string;
  refundError?: string;
  billingAction?: AIChatBillingAction;
}): Readonly<Record<string, unknown>> {
  return {
    usageId: options.usageId,
    reservationId: options.reservationId,
    reservedCredits: options.reservedCredits,
    estimatedCredits: options.estimatedCredits,
    settledCredits: options.settledCredits,
    releasedCredits: options.releasedCredits,
    refundedCredits: options.refundedCredits,
    overageCredits: options.overageCredits,
    settlementError: options.settlementError,
    refundError: options.refundError,
    billingAction: options.billingAction,
  };
}
