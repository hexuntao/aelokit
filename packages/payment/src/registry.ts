import { websiteConfig } from '@repo/config';
import type { PaymentProvider } from './provider';
import type { PaymentProviderName } from './types';
import { CreemProvider, type CreemWebhookCallbacks } from './providers/creem';
import {
  StripeProvider,
  type StripeWebhookCallbacks,
} from './providers/stripe';

export type PaymentProviderCallbacks = StripeWebhookCallbacks &
  CreemWebhookCallbacks;

type PaymentProviderFactory = (
  callbacks: PaymentProviderCallbacks
) => PaymentProvider;

const providerRegistry: Partial<
  Record<PaymentProviderName, PaymentProviderFactory>
> = {
  stripe: (callbacks) => new StripeProvider(callbacks),
  creem: (callbacks) => new CreemProvider(callbacks),
};

let paymentProvider: PaymentProvider | null = null;

function createPaymentProvider(
  callbacks: PaymentProviderCallbacks
): PaymentProvider {
  const name = websiteConfig.payment.provider;
  if (!name) throw new Error('payment.provider is required in websiteConfig.');
  const factory = providerRegistry[name];
  if (!factory) throw new Error(`Unsupported payment provider: ${name}.`);
  return factory(callbacks);
}

/**
 * Get the payment provider
 * @returns current payment provider instance
 * @throws Error if provider is not initialized
 */
export const getPaymentProvider = (
  callbacks: PaymentProviderCallbacks
): PaymentProvider => {
  if (!paymentProvider) paymentProvider = createPaymentProvider(callbacks);
  return paymentProvider;
};

/**
 * Create a checkout session for a plan
 * @param params Parameters for creating the checkout session
 * @returns Checkout result
 */
export const createCheckout = async (
  params: import('./types').CreateCheckoutParams,
  callbacks: PaymentProviderCallbacks
): Promise<import('./types').CheckoutResult> => {
  const provider = getPaymentProvider(callbacks);
  return provider.createCheckout(params);
};

/**
 * Create a checkout session for a credit package
 * @param params Parameters for creating the checkout session
 * @returns Checkout result
 */
export const createCreditCheckout = async (
  params: import('./types').CreateCreditCheckoutParams,
  callbacks: PaymentProviderCallbacks
): Promise<import('./types').CheckoutResult> => {
  const provider = getPaymentProvider(callbacks);
  return provider.createCreditCheckout(params);
};

/**
 * Create a customer portal session
 * @param params Parameters for creating the portal
 * @returns Portal result
 */
export const createCustomerPortal = async (
  params: import('./types').CreatePortalParams,
  callbacks: PaymentProviderCallbacks
): Promise<import('./types').PortalResult> => {
  const provider = getPaymentProvider(callbacks);
  return provider.createCustomerPortal(params);
};

/**
 * Handle webhook event
 * @param payload Raw webhook payload
 * @param signature Webhook signature
 */
export const handleWebhookEvent = async (
  payload: string,
  signature: string,
  callbacks: PaymentProviderCallbacks
): Promise<void> => {
  const provider = getPaymentProvider(callbacks);
  await provider.handleWebhookEvent(payload, signature);
};
