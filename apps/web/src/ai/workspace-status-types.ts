export interface AIWorkspaceUsageSummary {
  readonly windowDays: number;
  readonly totalRequests: number;
  readonly successfulRequests: number;
  readonly failedRequests: number;
  readonly totalTokens: number;
  readonly estimatedCostUsd: string | null;
  readonly lastUsageAt?: string;
}

export interface AIWorkspaceLatestUsage {
  readonly id: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly status: string;
  readonly billingStatus: string;
  readonly totalTokens: number | null;
  readonly createdAt: string;
}

export interface AIWorkspaceStatus {
  readonly credits: {
    readonly balance: number;
    readonly expiringSoon: number;
    readonly expirationWindowDays: number;
    readonly billingMode: 'audit_only' | 'credits';
  };
  readonly usage: AIWorkspaceUsageSummary;
  readonly latestUsage: readonly AIWorkspaceLatestUsage[];
}
