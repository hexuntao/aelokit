import { websiteConfig } from '@repo/config';
import { getBaseUrl } from '@/lib/urls';
import { defaultMessages } from '@/i18n/messages';
import {
  DiscordProvider,
  type DiscordProviderConfig,
  FeishuProvider,
  type FeishuProviderConfig,
} from '@repo/notification/providers';
import type { NotificationProvider } from '@repo/notification/types';
import {
  initNotificationRegistry,
  getNotificationProvider as _getNotificationProvider,
  sendPaymentNotification as _sendPaymentNotification,
  sendCreditDistributionNotification as _sendCreditDistributionNotification,
} from '@repo/notification';

initNotificationRegistry({
  discord: (config: DiscordProviderConfig): NotificationProvider => {
    const botName = defaultMessages.Metadata.name ?? config.botName ?? 'Bot';
    const logoPath = websiteConfig.metadata?.images?.logoLight;
    const avatarUrl = logoPath
      ? `${getBaseUrl()}${logoPath}`
      : config.avatarUrl;
    return new DiscordProvider({
      ...config,
      botName,
      avatarUrl,
    });
  },
  feishu: (config: FeishuProviderConfig): NotificationProvider => {
    return new FeishuProvider(config);
  },
});

export { getNotificationProvider } from '@repo/notification';
export { sendPaymentNotification } from '@repo/notification';
export { sendCreditDistributionNotification } from '@repo/notification';
