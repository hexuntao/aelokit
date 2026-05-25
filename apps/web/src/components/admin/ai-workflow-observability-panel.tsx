'use client';

import { getAIEvalResultsAction } from '@/actions/get-ai-eval-results';
import { getAIObservabilityEventsAction } from '@/actions/get-ai-observability-events';
import { getAIWorkflowRunsAction } from '@/actions/get-ai-workflow-runs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@repo/shared/utils';
import { RefreshCwIcon } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

interface WorkflowRunItem {
  readonly id: string;
  readonly workflowId: string;
  readonly workflowName: string;
  readonly status: string;
  readonly failureReason: string | null;
  readonly inputMetadata: unknown;
  readonly outputMetadata: unknown;
  readonly createdAt: Date;
}

interface EvalResultItem {
  readonly id: string;
  readonly workflowRunId: string | null;
  readonly scorerId: string;
  readonly status: string;
  readonly score: string | null;
  readonly metadata: unknown;
  readonly createdAt: Date;
}

interface ObservabilityEventItem {
  readonly id: string;
  readonly workflowRunId: string | null;
  readonly usageId: string | null;
  readonly eventType: string;
  readonly severity: string;
  readonly metadata: unknown;
  readonly createdAt: Date;
}

interface WorkflowObservabilityState {
  readonly workflows: readonly WorkflowRunItem[];
  readonly evals: readonly EvalResultItem[];
  readonly events: readonly ObservabilityEventItem[];
}

function statusVariant(value: string) {
  if (value === 'succeeded' || value === 'passed' || value === 'info') {
    return 'default';
  }

  if (value === 'failed' || value === 'error') {
    return 'destructive';
  }

  return 'outline';
}

function metadataPreview(metadata: unknown): string {
  if (!metadata || typeof metadata !== 'object') {
    return '-';
  }

  return JSON.stringify(metadata);
}

export function AIWorkflowObservabilityPanel() {
  const [state, setState] = useState<WorkflowObservabilityState | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      const [workflowResult, evalResult, eventResult] = await Promise.all([
        getAIWorkflowRunsAction({ limit: 8 }),
        getAIEvalResultsAction({ limit: 8 }),
        getAIObservabilityEventsAction({ limit: 12 }),
      ]);

      if (
        !workflowResult.data?.success ||
        !evalResult.data?.success ||
        !eventResult.data?.success
      ) {
        toast.error('Failed to load AI workflow observability records.');
        return;
      }

      setState({
        workflows: workflowResult.data.data ?? [],
        evals: evalResult.data.data ?? [],
        events: eventResult.data.data ?? [],
      });
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>AI Workflow Observability</CardTitle>
          <CardDescription>
            Recent workflow runs, eval results, and sanitized observability
            events, including runs that are not attached to chat usage rows.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={refresh}
        >
          <RefreshCwIcon className="mr-2 size-3.5" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-3">
        <AuditColumn
          title="Workflow Runs"
          loading={!state}
          emptyLabel="No workflow runs recorded yet."
          rows={state?.workflows.map((workflow) => ({
            id: workflow.id,
            title: workflow.workflowName,
            subtitle: workflow.workflowId,
            status: workflow.status,
            date: workflow.createdAt,
            metadata: workflow.failureReason
              ? { failureReason: workflow.failureReason }
              : workflow.outputMetadata,
          }))}
        />
        <AuditColumn
          title="Eval Results"
          loading={!state}
          emptyLabel="No eval results recorded yet."
          rows={state?.evals.map((evalResult) => ({
            id: evalResult.id,
            title: evalResult.scorerId,
            subtitle: evalResult.workflowRunId ?? 'standalone',
            status: evalResult.status,
            date: evalResult.createdAt,
            metadata: {
              score: evalResult.score,
              metadata: evalResult.metadata,
            },
          }))}
        />
        <AuditColumn
          title="Observability Events"
          loading={!state}
          emptyLabel="No observability events recorded yet."
          rows={state?.events.map((event) => ({
            id: event.id,
            title: event.eventType,
            subtitle: event.workflowRunId ?? event.usageId ?? 'standalone',
            status: event.severity,
            date: event.createdAt,
            metadata: event.metadata,
          }))}
        />
      </CardContent>
    </Card>
  );
}

function AuditColumn({
  title,
  loading,
  emptyLabel,
  rows,
}: {
  readonly title: string;
  readonly loading: boolean;
  readonly emptyLabel: string;
  readonly rows?: readonly {
    readonly id: string;
    readonly title: string;
    readonly subtitle: string;
    readonly status: string;
    readonly date: Date;
    readonly metadata: unknown;
  }[];
}) {
  return (
    <section className="space-y-3">
      <h3 className="font-medium text-sm">{title}</h3>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-md" />
          ))}
        </div>
      ) : rows && rows.length > 0 ? (
        <div className="space-y-2">
          {rows.map((row) => (
            <article key={row.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium text-sm">
                    {row.title}
                  </div>
                  <div className="truncate font-mono text-muted-foreground text-xs">
                    {row.subtitle}
                  </div>
                </div>
                <Badge
                  variant={statusVariant(row.status)}
                  className="shrink-0 whitespace-nowrap"
                >
                  {row.status}
                </Badge>
              </div>
              <div className="mt-2 text-muted-foreground text-xs">
                {formatDate(row.date)}
              </div>
              <pre className="mt-2 max-h-28 overflow-auto rounded bg-muted/40 p-2 text-xs">
                {metadataPreview(row.metadata)}
              </pre>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
          {emptyLabel}
        </div>
      )}
    </section>
  );
}
