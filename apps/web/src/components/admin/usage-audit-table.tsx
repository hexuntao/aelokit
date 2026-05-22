'use client';

import type { AIUsageAuditItem } from '@/actions/get-ai-usage-audit';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@repo/shared/utils';
import { SearchIcon, ShieldAlertIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

const STATUS_OPTIONS = [
  'audit_only',
  'preflight_failed',
  'reserved',
  'reservation_failed',
  'settled',
  'settlement_failed',
  'refunded',
  'refund_failed',
  'no_charge',
  'cancelled',
  'timeout',
  'rate_limited',
] as const;

export interface UsageAuditFilters {
  readonly userId: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly status: string;
  readonly dateFrom: string;
  readonly dateTo: string;
}

interface UsageAuditTableProps {
  readonly data: AIUsageAuditItem[];
  readonly total: number;
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly filters: UsageAuditFilters;
  readonly loading?: boolean;
  readonly error?: Error | null;
  readonly onFiltersChange: (filters: Partial<UsageAuditFilters>) => void;
  readonly onPageChange: (pageIndex: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

function formatNumber(value: number | null): string {
  return value === null ? '-' : new Intl.NumberFormat().format(value);
}

function formatMoney(value: string | null): string {
  if (!value) return '-';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat(undefined, {
    currency: 'USD',
    style: 'currency',
    maximumFractionDigits: 6,
  }).format(parsed);
}

function StatusBadge({ value }: { readonly value: string | null }) {
  if (!value) return <span className="text-muted-foreground">-</span>;

  const variant =
    value === 'settled'
      ? 'default'
      : value.includes('failed') ||
          value === 'timeout' ||
          value === 'rate_limited'
        ? 'destructive'
        : 'outline';

  return (
    <Badge variant={variant} className="whitespace-nowrap px-1.5">
      {value}
    </Badge>
  );
}

function TableSkeleton({ pageSize }: { readonly pageSize: number }) {
  return Array.from({ length: pageSize }).map((_, rowIndex) => (
    <TableRow key={rowIndex} className="h-14">
      {Array.from({ length: 17 }).map((__, cellIndex) => (
        <TableCell key={cellIndex} className="py-3">
          <Skeleton className="h-4 w-24" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

export function UsageAuditTable({
  data,
  total,
  pageIndex,
  pageSize,
  filters,
  loading,
  error,
  onFiltersChange,
  onPageChange,
  onPageSizeChange,
}: UsageAuditTableProps) {
  const t = useTranslations('Dashboard.admin.usage');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isUnauthorized = error?.message.toLowerCase().includes('unauthorized');

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={filters.userId}
            onChange={(event) =>
              onFiltersChange({ userId: event.target.value })
            }
            placeholder={t('filters.userId')}
            className="h-8 w-[220px] pr-8 pl-8"
          />
          {filters.userId ? (
            <button
              type="button"
              aria-label={t('filters.clearUserId')}
              className="-translate-y-1/2 absolute top-1/2 right-2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onFiltersChange({ userId: '' })}
            >
              <XIcon className="size-3.5" />
            </button>
          ) : null}
        </div>
        <Input
          value={filters.providerId}
          onChange={(event) =>
            onFiltersChange({ providerId: event.target.value })
          }
          placeholder={t('filters.providerId')}
          className="h-8 w-[160px]"
        />
        <Input
          value={filters.modelId}
          onChange={(event) => onFiltersChange({ modelId: event.target.value })}
          placeholder={t('filters.modelId')}
          className="h-8 w-[160px]"
        />
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ status: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue placeholder={t('filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(event) =>
            onFiltersChange({ dateFrom: event.target.value })
          }
          className="h-8 w-[150px]"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(event) => onFiltersChange({ dateTo: event.target.value })}
          className="h-8 w-[150px]"
        />
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <ShieldAlertIcon className="size-4 shrink-0" />
          {isUnauthorized ? t('permissionDenied') : t('error')}
        </div>
      ) : null}

      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead>{t('columns.usageId')}</TableHead>
                <TableHead>{t('columns.userId')}</TableHead>
                <TableHead>{t('columns.threadId')}</TableHead>
                <TableHead>{t('columns.messageId')}</TableHead>
                <TableHead>{t('columns.provider')}</TableHead>
                <TableHead>{t('columns.model')}</TableHead>
                <TableHead>{t('columns.inputTokens')}</TableHead>
                <TableHead>{t('columns.outputTokens')}</TableHead>
                <TableHead>{t('columns.totalTokens')}</TableHead>
                <TableHead>{t('columns.estimatedCost')}</TableHead>
                <TableHead>{t('columns.estimatedCredits')}</TableHead>
                <TableHead>{t('columns.billingMode')}</TableHead>
                <TableHead>{t('columns.billingStatus')}</TableHead>
                <TableHead>{t('columns.reservationStatus')}</TableHead>
                <TableHead>{t('columns.settlementStatus')}</TableHead>
                <TableHead>{t('columns.refundStatus')}</TableHead>
                <TableHead>{t('columns.failureReason')}</TableHead>
                <TableHead>{t('columns.createdAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton pageSize={pageSize} />
              ) : data.length > 0 ? (
                data.map((item) => (
                  <TableRow key={item.id} className="h-14">
                    <TableCell className="max-w-[160px] truncate font-mono text-xs">
                      {item.id}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate font-mono text-xs">
                      {item.userId}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate font-mono text-xs">
                      {item.threadId ?? '-'}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate font-mono text-xs">
                      {item.messageId ?? '-'}
                    </TableCell>
                    <TableCell>{item.providerId}</TableCell>
                    <TableCell>{item.modelId}</TableCell>
                    <TableCell>{formatNumber(item.inputTokens)}</TableCell>
                    <TableCell>{formatNumber(item.outputTokens)}</TableCell>
                    <TableCell>{formatNumber(item.totalTokens)}</TableCell>
                    <TableCell>{formatMoney(item.estimatedCostUsd)}</TableCell>
                    <TableCell>{formatNumber(item.estimatedCredits)}</TableCell>
                    <TableCell>
                      <StatusBadge value={item.billingMode} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={item.billingStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={item.reservationStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={item.settlementStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={item.refundStatus} />
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {item.failureReason ?? '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={18} className="h-24 text-center">
                    {t('empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-muted-foreground text-sm">
            {t('pagination.total', { total })}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[96px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageIndex <= 0}
              onClick={() => onPageChange(pageIndex - 1)}
            >
              {t('pagination.previous')}
            </Button>
            <span className="text-sm">
              {t('pagination.page', {
                page: pageIndex + 1,
                total: totalPages,
              })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageIndex + 1 >= totalPages}
              onClick={() => onPageChange(pageIndex + 1)}
            >
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
