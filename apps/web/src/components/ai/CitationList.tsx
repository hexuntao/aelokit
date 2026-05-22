'use client';

import { FileText, ExternalLink, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CitationMetadata } from './types';

interface CitationItemProps {
  citation: CitationMetadata;
  index: number;
  compact?: boolean;
}

function getProvenanceLabel(provenance: string): string {
  if (provenance.startsWith('manual-note:')) {
    return 'Manual entry';
  }
  if (provenance.startsWith('http://') || provenance.startsWith('https://')) {
    return 'URL';
  }
  if (provenance.startsWith('uploaded:')) {
    return 'Uploaded document';
  }
  return 'Source';
}

function formatScore(score: number): string {
  if (score >= 0.9) return 'High relevance';
  if (score >= 0.7) return 'Good match';
  if (score >= 0.5) return 'Moderate match';
  return 'Low match';
}

function CitationItem({ citation, index, compact = false }: CitationItemProps) {
  const provenanceLabel = getProvenanceLabel(citation.provenance);
  const scoreLabel = formatScore(citation.score);
  const isUrl =
    citation.provenance.startsWith('http://') ||
    citation.provenance.startsWith('https://');

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">[{index + 1}]</span>
        <span className="truncate max-w-[200px]">{citation.title}</span>
        <span className="text-[10px] opacity-60">({scoreLabel})</span>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-background/70 px-3 py-2 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 font-mono text-muted-foreground">
            [{index + 1}]
          </span>
          <div className="flex items-center gap-1.5 min-w-0">
            <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{citation.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
          <span className="text-[10px]">{scoreLabel}</span>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <FileText className="size-3" />
          <span>{provenanceLabel}</span>
        </div>
        {isUrl && (
          <a
            href={citation.provenance}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 underline-offset-2 hover:underline"
          >
            <ExternalLink className="size-3" />
            <span>Open</span>
          </a>
        )}
      </div>
    </div>
  );
}

interface CitationListProps {
  citations: readonly CitationMetadata[];
  compact?: boolean;
  className?: string;
}

export function CitationList({
  citations,
  compact = false,
  className,
}: CitationListProps) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {!compact && (
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <BookOpen className="size-3.5" />
          <span>Sources ({citations.length})</span>
        </div>
      )}
      <div className={cn('flex flex-col gap-1.5', compact && 'flex-wrap')}>
        {citations.map((citation, index) => (
          <CitationItem
            key={`${citation.sourceId}-${citation.chunkId}`}
            citation={citation}
            index={index}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

export function CitationSummary({
  citations,
  className,
}: {
  citations: readonly CitationMetadata[];
  className?: string;
}) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border bg-background/50 px-2.5 py-1.5 text-xs text-muted-foreground',
        className
      )}
    >
      <BookOpen className="size-3.5" />
      <span>
        {citations.length} source{citations.length !== 1 ? 's' : ''} cited
      </span>
    </div>
  );
}
