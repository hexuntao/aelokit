import type { PaymentStatus } from './types';

export function isSubscriptionActive(status: PaymentStatus): boolean {
  return status === 'active' || status === 'trialing';
}

export function isPaymentProviderName(
  value: string
): value is import('./types').PaymentProviderName {
  return value === 'stripe' || value === 'creem';
}
