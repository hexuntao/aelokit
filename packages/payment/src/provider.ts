import type {
  CheckoutResult,
  CreateCheckoutParams,
  CreateCreditCheckoutParams,
  CreatePortalParams,
  PortalResult,
} from './types';

export interface PaymentProvider {
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>;
  createCreditCheckout(
    params: CreateCreditCheckoutParams
  ): Promise<CheckoutResult>;
  createCustomerPortal(params: CreatePortalParams): Promise<PortalResult>;
  handleWebhookEvent(payload: string, signature: string): Promise<void>;
  getProviderName(): string;
}
