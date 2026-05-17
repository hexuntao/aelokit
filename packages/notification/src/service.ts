import { websiteConfig } from '@repo/config';
import type {
  SendCreditDistributionNotificationParams,
  SendPaymentNotificationParams,
} from './types';
import { getNotificationProvider } from './registry';

export async function sendPaymentNotification(
  params: SendPaymentNotificationParams
): Promise<void> {
  if (!websiteConfig.notification?.enable) return;
  const provider = getNotificationProvider();
  await provider.sendPaymentNotification(params);
}

export async function sendCreditDistributionNotification(
  params: SendCreditDistributionNotificationParams
): Promise<void> {
  if (!websiteConfig.notification?.enable) return;
  const provider = getNotificationProvider();
  await provider.sendCreditDistributionNotification(params);
}
