import { websiteConfig } from '@repo/config';
import { serverEnv } from '@repo/env/server';
import type { NotificationProvider, NotificationProviderName } from './types';
import {
  DiscordProvider,
  type DiscordProviderConfig,
  FeishuProvider,
  type FeishuProviderConfig,
} from './providers';

export interface NotificationProviderFactoryConfig {
  discord?: (config: DiscordProviderConfig) => NotificationProvider;
  feishu?: (config: FeishuProviderConfig) => NotificationProvider;
}

type ProviderFactory = () => NotificationProvider;

function createProviderRegistry(
  factoryConfig?: NotificationProviderFactoryConfig
): Partial<Record<NotificationProviderName, ProviderFactory>> {
  return {
    discord: () => {
      const webhookUrl = serverEnv.DISCORD_WEBHOOK_URL;
      if (!webhookUrl) throw new Error('DISCORD_WEBHOOK_URL is required.');
      const config: DiscordProviderConfig = {
        webhookUrl,
        botName: 'Bot',
      };
      if (factoryConfig?.discord) {
        return factoryConfig.discord(config);
      }
      return new DiscordProvider(config);
    },
    feishu: () => {
      const webhookUrl = serverEnv.FEISHU_WEBHOOK_URL;
      if (!webhookUrl) throw new Error('FEISHU_WEBHOOK_URL is required.');
      const config: FeishuProviderConfig = { webhookUrl };
      if (factoryConfig?.feishu) {
        return factoryConfig.feishu(config);
      }
      return new FeishuProvider(config);
    },
  };
}

let notificationProvider: NotificationProvider | null = null;
let providerRegistry: Partial<
  Record<NotificationProviderName, ProviderFactory>
>;

export function initNotificationRegistry(
  factoryConfig?: NotificationProviderFactoryConfig
): void {
  providerRegistry = createProviderRegistry(factoryConfig);
  notificationProvider = null;
}

function getRegistry(): Partial<
  Record<NotificationProviderName, ProviderFactory>
> {
  if (!providerRegistry) {
    providerRegistry = createProviderRegistry();
  }
  return providerRegistry;
}

function createProvider(): NotificationProvider {
  const name = websiteConfig.notification?.provider;
  if (!name)
    throw new Error('notification.provider is required in websiteConfig.');
  const factory = getRegistry()[name];
  if (!factory) {
    throw new Error(`Unsupported notification provider: ${name}.`);
  }
  return factory();
}

export function getNotificationProvider(): NotificationProvider {
  if (!notificationProvider) notificationProvider = createProvider();
  return notificationProvider;
}
