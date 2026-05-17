/**
 * Credit transaction type enum
 */
export type { CreditPackage, CreditPackagePrice } from '@repo/config';

export enum CREDIT_TRANSACTION_TYPE {
  MONTHLY_REFRESH = 'MONTHLY_REFRESH',
  REGISTER_GIFT = 'REGISTER_GIFT',
  PURCHASE_PACKAGE = 'PURCHASE_PACKAGE',
  SUBSCRIPTION_RENEWAL = 'SUBSCRIPTION_RENEWAL',
  LIFETIME_MONTHLY = 'LIFETIME_MONTHLY',
  USAGE = 'USAGE',
  EXPIRE = 'EXPIRE',
}

export interface CreditTransaction {
  id: string; // Unique identifier for the transaction
  userId: string; // User ID who owns this transaction
  type: string; // Transaction type (CREDIT_TRANSACTION_TYPE)
  description: string | null; // Transaction description
  amount: number; // Credit amount (positive for earning, negative for spending)
  remainingAmount: number | null; // Remaining credit amount (for tracking expiration)
  paymentId: string | null; // Associated invoice ID
  expirationDate: Date | null; // Credit expiration date
  expirationDateProcessedAt: Date | null; // Timestamp when expiration was processed
  createdAt: Date; // Transaction creation timestamp
  updatedAt: Date; // Transaction last update timestamp
}
