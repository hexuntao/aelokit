'use client';

import { useState, useTransition } from 'react';
import {
  archiveKnowledgeSourceAction,
  deleteKnowledgeSourceAction,
  getUserKnowledgeSourcesAction,
} from '@/actions/knowledge';
import { runKnowledgeReindexAuditWorkflowAction } from '@/actions/knowledge-workflows';
import type { KnowledgeSourceRecord } from '@/ai/knowledge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@repo/shared/utils';
import { toast } from 'sonner';
import { KnowledgeSourceForm } from './knowledge-source-form';

interface KnowledgeSourceManagerProps {
  readonly initialSources: readonly KnowledgeSourceRecord[];
}

export function KnowledgeSourceManager({
  initialSources,
}: KnowledgeSourceManagerProps) {
  const [sources, setSources] =
    useState<readonly KnowledgeSourceRecord[]>(initialSources);
  const [isPending, startTransition] = useTransition();

  const refreshSources = () => {
    startTransition(async () => {
      const result = await getUserKnowledgeSourcesAction();
      if (result.data?.success && result.data.sources) {
        setSources(result.data.sources);
      }
    });
  };

  const handleArchive = (sourceId: string) => {
    startTransition(async () => {
      const result = await archiveKnowledgeSourceAction({ sourceId });
      if (!result.data?.success || !result.data.source) {
        toast.error(
          result.data?.error ?? 'Failed to archive knowledge source.'
        );
        return;
      }

      setSources((current) =>
        current.map((source) =>
          source.id === sourceId ? result.data!.source! : source
        )
      );
      toast.success('Knowledge source archived.');
    });
  };

  const handleDelete = (sourceId: string) => {
    startTransition(async () => {
      const result = await deleteKnowledgeSourceAction({ sourceId });
      if (!result.data?.success) {
        toast.error(result.data?.error ?? 'Failed to delete knowledge source.');
        return;
      }

      if (result.data.cleanupFailed && result.data.source) {
        setSources((current) =>
          current.map((source) =>
            source.id === sourceId ? result.data!.source! : source
          )
        );
        toast.warning(
          result.data.error ??
            'Knowledge source archived, but vector cleanup needs retry.'
        );
        return;
      }

      setSources((current) =>
        current.filter((source) => source.id !== sourceId)
      );
      toast.success('Knowledge source deleted.');
    });
  };

  const handleReindex = (sourceId: string) => {
    startTransition(async () => {
      const result = await runKnowledgeReindexAuditWorkflowAction({ sourceId });
      if (!result.data?.success) {
        toast.error(result.data?.error ?? 'Failed to run reindex audit.');
        return;
      }

      toast.success(
        `Reindex audit started: ${result.data.workflowRunId} (${result.data.status})`
      );
    });
  };

  return (
    <div className="space-y-6">
      <KnowledgeSourceForm onCreated={refreshSources} />

      <Card>
        <CardHeader>
          <CardTitle>Knowledge Sources</CardTitle>
          <CardDescription>
            Manual sources you can inspect, archive, permanently delete, and
            reindex.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sources.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No knowledge sources yet.
            </div>
          ) : (
            sources.map((source, index) => (
              <div key={source.id} className="space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{source.title}</h3>
                      <Badge variant="outline">{source.kind}</Badge>
                      <Badge variant="secondary">{source.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Source ID: <span className="font-mono">{source.id}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Visibility: {source.visibility}</span>
                      <span>Chunks: {source.chunkCount}</span>
                      <span>Vectors: {source.vectorCount}</span>
                      <span>
                        Created: {formatDate(new Date(source.createdAt))}
                      </span>
                      <span>
                        Indexed:{' '}
                        {source.indexedAt
                          ? formatDate(new Date(source.indexedAt))
                          : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleReindex(source.id)}
                      disabled={isPending}
                    >
                      Run Reindex Audit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(source.id)}
                      disabled={isPending || source.status === 'archived'}
                    >
                      Archive
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(source.id)}
                      disabled={isPending}
                    >
                      Delete Permanently
                    </Button>
                  </div>
                </div>
                {index < sources.length - 1 ? <Separator /> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
