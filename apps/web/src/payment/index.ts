import { websiteConfig } from '@/config/website';
import {
  addCredits,
  addLifetimeMonthlyCredits,
  addSubscriptionCredits,
} from '@/credits/credits';
import { getCreditPackageById } from '@/credits/server';
import { CREDIT_TRANSACTION_TYPE } from '@/credits/types';
import {
  PAYMENT_RECORD_RETRY_ATTEMPTS,
  PAYMENT_RECORD_RETRY_DELAY,
} from '@/lib/constants';
import {
  findPlanByPlanId,
  findPlanByPriceId,
  findPriceInPlan,
} from '@/lib/price-plan';
import { sendPaymentNotification } from '@/notification';
import {
  createCheckout as _createCheckout,
  createCreditCheckout as _createCreditCheckout,
  createCustomerPortal as _createCustomerPortal,
  handleWebhookEvent as _handleWebhookEvent,
  getPaymentProvider as _getPaymentProvider,
  type PaymentProviderCallbacks,
} from '@repo/payment/registry';
import type {
  CheckoutResult,
  CreateCheckoutParams,
  CreateCreditCheckoutParams,
  CreatePortalParams,
  PortalResult,
} from '@repo/payment/types';
import type { PaymentProvider } from '@repo/payment/provider';

const paymentCallbacks: PaymentProviderCallbacks = {
  findPlanByPlanId,
  findPriceInPlan,
  findPlanByPriceId,
  getCreditPackageById,
  addCredits,
  addSubscriptionCredits,
  addLifetimeMonthlyCredits,
  sendPaymentNotification,
  paymentRecordRetryAttempts: PAYMENT_RECORD_RETRY_ATTEMPTS,
  paymentRecordRetryDelay: PAYMENT_RECORD_RETRY_DELAY,
};

/**
 * Get the payment provider
 * @returns current payment provider instance
 * @throws Error if provider is not initialized
 */
export const getPaymentProvider = (): PaymentProvider => {
  return _getPaymentProvider(paymentCallbacks);
};

/**
 * Create a checkout session for a plan
 * @param params Parameters for creating the checkout session
 * @returns Checkout result
 */
export const createCheckout = async (
  params: CreateCheckoutParams
): Promise<CheckoutResult> => {
  return _createCheckout(params, paymentCallbacks);
};

/**
 * Create a checkout session for a credit package
 * @param params Parameters for creating the checkout session
 * @returns Checkout result
 */
export const createCreditCheckout = async (
  params: CreateCreditCheckoutParams
): Promise<CheckoutResult> => {
  return _createCreditCheckout(params, paymentCallbacks);
};

/**
 * Create a customer portal session
 * @param params Parameters for creating the portal
 * @returns Portal result
 */
export const createCustomerPortal = async (
  params: CreatePortalParams
): Promise<PortalResult> => {
  return _createCustomerPortal(params, paymentCallbacks);
};

/**
 * Handle webhook event
 * @param payload Raw webhook payload
 * @param signature Webhook signature
 */
export const handleWebhookEvent = async (
  payload: string,
  signature: string
): Promise<void> => {
  await _handleWebhookEvent(payload, signature, paymentCallbacks);
};
