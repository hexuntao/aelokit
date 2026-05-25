'use client';

import {
  UsageAuditTable,
  type UsageAuditFilters,
} from '@/components/admin/usage-audit-table';
import { AIProductControls } from '@/components/admin/ai-product-controls';
import { useAIUsageAudit } from '@/hooks/use-ai-usage-audit';
import {
  parseAsIndex,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import { useMemo } from 'react';

export function UsageAuditPageClient() {
  const [
    {
      page,
      size,
      userId,
      providerId,
      modelId,
      agentId,
      toolName,
      workflowStatus,
      knowledge,
      minTokens,
      maxTokens,
      minCost,
      maxCost,
      status,
      dateFrom,
      dateTo,
    },
    setQueryStates,
  ] = useQueryStates({
    page: parseAsIndex.withDefault(0),
    size: parseAsInteger.withDefault(10),
    userId: parseAsString.withDefault(''),
    providerId: parseAsString.withDefault(''),
    modelId: parseAsString.withDefault(''),
    agentId: parseAsString.withDefault(''),
    toolName: parseAsString.withDefault(''),
    workflowStatus: parseAsString.withDefault(''),
    knowledge: parseAsString.withDefault(''),
    minTokens: parseAsString.withDefault(''),
    maxTokens: parseAsString.withDefault(''),
    minCost: parseAsString.withDefault(''),
    maxCost: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
    dateFrom: parseAsString.withDefault(''),
    dateTo: parseAsString.withDefault(''),
  });

  const filters = useMemo<UsageAuditFilters>(
    () => ({
      userId,
      providerId,
      modelId,
      agentId,
      toolName,
      workflowStatus,
      knowledge,
      minTokens,
      maxTokens,
      minCost,
      maxCost,
      status,
      dateFrom,
      dateTo,
    }),
    [
      userId,
      providerId,
      modelId,
      agentId,
      toolName,
      workflowStatus,
      knowledge,
      minTokens,
      maxTokens,
      minCost,
      maxCost,
      status,
      dateFrom,
      dateTo,
    ]
  );

  const { data, isLoading, error } = useAIUsageAudit({
    pageIndex: page,
    pageSize: size,
    ...filters,
  });

  return (
    <div className="space-y-6">
      <AIProductControls />
      <UsageAuditTable
        data={data?.items || []}
        total={data?.total || 0}
        pageIndex={page}
        pageSize={size}
        filters={filters}
        loading={isLoading}
        error={error}
        onFiltersChange={(nextFilters) =>
          setQueryStates(
            {
              ...nextFilters,
              page: 0,
            },
            { history: 'replace', shallow: true }
          )
        }
        onPageChange={(nextPage) => setQueryStates({ page: nextPage })}
        onPageSizeChange={(nextSize) =>
          setQueryStates({ size: nextSize, page: 0 })
        }
      />
    </div>
  );
}
