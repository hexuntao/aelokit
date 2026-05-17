export {
  PlanIntervals,
  PaymentTypes,
} from '@repo/config';

export type {
  PaymentProviderName,
  PlanInterval,
  PaymentType,
  Price,
  Credits,
  PricePlan,
} from '@repo/config';

export type PaymentScene =
  | PaymentScenes.LIFETIME
  | PaymentScenes.CREDIT
  | PaymentScenes.SUBSCRIPTION;

export enum PaymentScenes {
  LIFETIME = 'lifetime',
  CREDIT = 'credit',
  SUBSCRIPTION = 'subscription',
}

export type PaymentStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | 'unpaid'
  | 'completed'
  | 'processing'
  | 'failed';

export interface Customer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface Subscription {
  id: string;
  customerId: string;
  status: PaymentStatus;
  priceId: string;
  type: import('@repo/config').PaymentType;
  interval?: import('@repo/config').PlanInterval;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialStartDate?: Date;
  trialEndDate?: Date;
  createdAt: Date;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutParams {
  planId: string;
  priceId: string;
  customerEmail: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  locale?: string;
}

export interface CreateCreditCheckoutParams {
  packageId: string;
  priceId: string;
  customerEmail: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  locale?: string;
}

export interface CheckoutResult {
  url: string;
  id: string;
}

export interface CreatePortalParams {
  customerId: string;
  returnUrl?: string;
  locale?: string;
}

export interface PortalResult {
  url: string;
}

export interface getSubscriptionsParams {
  userId: string;
}
