import type {
  NotificationProvider,
  SendCreditDistributionNotificationParams,
  SendPaymentNotificationParams,
} from '../types';

async function sendMessage(
  webhookUrl: string,
  body: Record<string, unknown>
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    console.error('Failed to send Discord message:', response);
  }
}

export interface DiscordProviderConfig {
  webhookUrl: string;
  botName?: string;
  avatarUrl?: string;
}

export class DiscordProvider implements NotificationProvider {
  private webhookUrl: string;
  private botName: string;
  private avatarUrl?: string;

  constructor(config: DiscordProviderConfig) {
    this.webhookUrl = config.webhookUrl;
    this.botName = config.botName ?? 'Bot';
    this.avatarUrl = config.avatarUrl;
  }

  getProviderName(): string {
    return 'discord';
  }

  async sendPaymentNotification(
    params: SendPaymentNotificationParams
  ): Promise<void> {
    const { sessionId, customerId, userName, amount } = params;
    try {
      const body: Record<string, unknown> = {
        username: this.botName,
        embeds: [
          {
            title: '🎉 New Purchase',
            color: 0x4caf50,
            fields: [
              { name: 'Username', value: userName, inline: true },
              { name: 'Amount', value: `$${amount.toFixed(2)}`, inline: true },
              {
                name: 'Customer ID',
                value: `\`${customerId}\``,
                inline: false,
              },
              { name: 'Session ID', value: `\`${sessionId}\``, inline: false },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };
      if (this.avatarUrl) body.avatar_url = this.avatarUrl;
      await sendMessage(this.webhookUrl, body);
      console.log(
        `Successfully sent Discord notification for user ${userName}`
      );
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }
  }

  async sendCreditDistributionNotification(
    params: SendCreditDistributionNotificationParams
  ): Promise<void> {
    const { usersCount, processedCount, errorCount } = params;
    try {
      const body: Record<string, unknown> = {
        username: this.botName,
        embeds: [
          {
            title: '🎉 Credit Distribution',
            color: 0x4caf50,
            fields: [
              { name: 'Users', value: usersCount.toString(), inline: true },
              {
                name: 'Processed',
                value: processedCount.toString(),
                inline: true,
              },
              { name: 'Errors', value: errorCount.toString(), inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };
      if (this.avatarUrl) body.avatar_url = this.avatarUrl;
      await sendMessage(this.webhookUrl, body);
      console.log(
        'Successfully sent Discord notification for credit distribution'
      );
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }
  }
}
