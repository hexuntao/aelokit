import { getAIUsageAuditAction } from '@/actions/get-ai-usage-audit';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const aiUsageAuditKeys = {
  all: ['ai-usage-audit'] as const,
  lists: () => [...aiUsageAuditKeys.all, 'lists'] as const,
  list: (params: AIUsageAuditQueryParams) =>
    [...aiUsageAuditKeys.lists(), params] as const,
};

export interface AIUsageAuditQueryParams {
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly userId: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly status: string;
  readonly dateFrom: string;
  readonly dateTo: string;
}

export function useAIUsageAudit(params: AIUsageAuditQueryParams) {
  return useQuery({
    queryKey: aiUsageAuditKeys.list(params),
    queryFn: async () => {
      const result = await getAIUsageAuditAction(params);

      if (!result?.data?.success) {
        throw new Error(
          result?.data?.error || 'Failed to fetch AI usage audit'
        );
      }

      return {
        items: result.data.data?.items || [],
        total: result.data.data?.total || 0,
      };
    },
    placeholderData: keepPreviousData,
  });
}
