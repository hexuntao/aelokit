'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  createManualKnowledgeSourceAction,
  checkEmbeddingProviderStatusAction,
} from '@/actions/knowledge';

export function KnowledgeSourceForm() {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    chunkCount?: number;
    vectorCount?: number;
  } | null>(null);
  const [embeddingStatus, setEmbeddingStatus] = useState<{
    checked: boolean;
    configured: boolean;
  }>({ checked: false, configured: false });

  async function checkEmbedding() {
    const response = await checkEmbeddingProviderStatusAction();
    if (response.data?.configured) {
      setEmbeddingStatus({ checked: true, configured: true });
    } else {
      setEmbeddingStatus({ checked: true, configured: false });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await createManualKnowledgeSourceAction({ title, text });

      if (response.data?.success && response.data.result) {
        setResult({
          success: true,
          message: 'Knowledge source created successfully!',
          chunkCount: response.data.result.chunkCount,
          vectorCount: response.data.result.vectorCount,
        });
        setTitle('');
        setText('');
      } else {
        setResult({
          success: false,
          message: response.data?.error || 'Failed to create knowledge source.',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!embeddingStatus.checked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Source</CardTitle>
          <CardDescription>
            Add a manual text source to your knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={checkEmbedding} variant="outline">
            Check Configuration
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!embeddingStatus.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Source</CardTitle>
          <CardDescription>
            Embedding provider is not configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Embedding provider is not configured. Please set{' '}
              <code className="text-xs">AI_EMBEDDING_API_KEY</code> or{' '}
              <code className="text-xs">OPENAI_API_KEY</code> environment
              variable.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Source</CardTitle>
        <CardDescription>
          Add a manual text source to your knowledge base. The text will be
          chunked, embedded, and stored for retrieval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this knowledge source"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">Text Content</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type the text content you want to add to the knowledge base..."
              disabled={isLoading}
              required
              rows={10}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {text.length} characters
            </p>
          </div>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.message}
                {result.success && result.chunkCount !== undefined && (
                  <span className="block mt-1 text-xs">
                    Created {result.chunkCount} chunks and {result.vectorCount}{' '}
                    vectors.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isLoading || !title.trim() || !text.trim()}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Processing...' : 'Add to Knowledge Base'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
