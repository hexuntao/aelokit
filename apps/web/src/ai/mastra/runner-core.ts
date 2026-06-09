import { toAISdkStream } from '@mastra/ai-sdk';
import type { ToolSet, UIMessage, UIMessageChunk } from 'ai';
import type { ChunkType, MastraModelOutput } from '@mastra/core/stream';
import type { AIRuntimeContext } from '../context';
import type { ResolvedModel } from '../models';
import type { ChatRuntimeRequest } from '../runtime';

export interface MastraChatRequestContextShape {
  readonly userId: string;
  readonly threadId: string;
  readonly messageId: string;
  readonly memoryResourceId: string;
  readonly memoryThreadIds: readonly string[];
  readonly memoryRecallPolicy: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly providerModelId: string;
  readonly modelSelectionSource: string;
  readonly memoryEnabled: boolean;
  readonly knowledgeEnabled: boolean;
  readonly knowledgeRetrievalProvider?: string;
  readonly knowledgeChunkCount: number;
  readonly knowledgeCitationCount: number;
  readonly systemPrompt: string;
}

export interface MastraChatRunnerOptions {
  readonly request: ChatRuntimeRequest;
  readonly inputMessages: readonly UIMessage[];
  readonly systemPrompt: string;
  readonly tools?: Record<string, unknown>;
  readonly serverTools?: ToolSet;
  readonly memoryEnabled: boolean;
  readonly memoryResourceId?: string;
  readonly memoryThreadIds?: readonly string[];
  readonly memoryRecallPolicy?: string;
  readonly knowledgeEnabled: boolean;
  readonly knowledgeRetrievalProvider?: string;
  readonly knowledgeChunkCount?: number;
  readonly knowledgeCitationCount?: number;
  readonly abortSignal?: AbortSignal;
  readonly onAbort?: () => Promise<void> | void;
  readonly onFinish?: (event: unknown) => Promise<void> | void;
  readonly onError?: (event: unknown) => Promise<void> | void;
  readonly onChunk?: (chunk: ChunkType) => Promise<void> | void;
  readonly onToolCallStart?: (
    event: MastraToolCallStartEvent
  ) => Promise<void> | void;
  readonly onToolCallFinish?: (
    event: MastraToolCallFinishEvent
  ) => Promise<void> | void;
  readonly messageMetadata?: (options: {
    part: unknown;
  }) => Record<string, unknown> | undefined;
  readonly convertStream?: (
    output: MastraModelOutput<unknown>,
    options: {
      messageMetadata?: MastraChatRunnerOptions['messageMetadata'];
    }
  ) => ReadableStream<UIMessageChunk>;
  readonly createAgentExecution?: (
    options: MastraChatAgentExecutionOptions
  ) => Promise<MastraChatAgentExecution> | MastraChatAgentExecution;
}

export interface MastraChatAgentExecutionOptions {
  readonly request: ChatRuntimeRequest;
  readonly systemPrompt: string;
  readonly tools: ToolSet;
  readonly memoryEnabled: boolean;
  readonly memoryResourceId?: string;
  readonly memoryThreadIds?: readonly string[];
  readonly memoryRecallPolicy?: string;
  readonly knowledgeEnabled: boolean;
  readonly knowledgeRetrievalProvider?: string;
  readonly knowledgeChunkCount?: number;
  readonly knowledgeCitationCount?: number;
}

export interface MastraRequestContextLike<TShape extends Record<string, any>> {
  set<TKey extends keyof TShape>(key: TKey, value: TShape[TKey]): void;
  get<TKey extends keyof TShape>(key: TKey): TShape[TKey] | undefined;
}

export interface MastraChatAgentLike {
  getInstructions(options: {
    requestContext: MastraRequestContextLike<MastraChatRequestContextShape>;
  }): Promise<unknown> | unknown;
  stream(
    messages: readonly UIMessage[],
    options: {
      requestContext: MastraRequestContextLike<MastraChatRequestContextShape>;
      resourceId?: string;
      threadId?: string;
      abortSignal?: AbortSignal;
      onAbort?: () => Promise<void> | void;
      onFinish?: (event: unknown) => Promise<void> | void;
      onError?: (event: unknown) => Promise<void> | void;
      onChunk?: (chunk: ChunkType) => Promise<void> | void;
    }
  ): Promise<MastraModelOutput<unknown>>;
}

export interface MastraChatAgentExecution {
  readonly agent: MastraChatAgentLike;
  readonly requestContext: MastraRequestContextLike<MastraChatRequestContextShape>;
}

export interface MastraChatRunnerResult extends MastraChatAgentExecution {
  readonly systemPrompt: string;
  readonly stream: ReadableStream<UIMessageChunk>;
  readonly output: MastraModelOutput<unknown>;
}

export interface MastraToolCallEventBase {
  readonly toolCall: {
    readonly toolCallId: string;
    readonly toolName: string;
    readonly input: unknown;
    readonly providerExecuted?: boolean;
  };
}

export interface MastraToolCallStartEvent extends MastraToolCallEventBase {}

export interface MastraToolCallFinishEvent extends MastraToolCallEventBase {
  readonly success: boolean;
  readonly output?: unknown;
  readonly error?: unknown;
  readonly durationMs?: number;
}

type MastraChatAgent = MastraChatAgentExecution['agent'];

class AeloKitMastraRequestContext<TShape extends Record<string, any>>
  implements MastraRequestContextLike<TShape>
{
  private readonly values = new Map<keyof TShape, TShape[keyof TShape]>();

  set<TKey extends keyof TShape>(key: TKey, value: TShape[TKey]) {
    this.values.set(key, value);
  }

  get<TKey extends keyof TShape>(key: TKey): TShape[TKey] | undefined {
    return this.values.get(key) as TShape[TKey] | undefined;
  }
}

function createMastraChatRequestContextValue(
  runtimeContext: AIRuntimeContext,
  resolvedModel: ResolvedModel,
  systemPrompt: string,
  memoryEnabled: boolean,
  knowledgeEnabled: boolean,
  metadata: {
    readonly memoryResourceId?: string;
    readonly memoryThreadIds?: readonly string[];
    readonly memoryRecallPolicy?: string;
    readonly knowledgeRetrievalProvider?: string;
    readonly knowledgeChunkCount?: number;
    readonly knowledgeCitationCount?: number;
  } = {}
): MastraChatRequestContextShape {
  return {
    userId: runtimeContext.userId,
    threadId: runtimeContext.threadId ?? '',
    messageId: runtimeContext.messageId ?? '',
    memoryResourceId: metadata.memoryResourceId ?? runtimeContext.userId,
    memoryThreadIds: metadata.memoryThreadIds ?? [],
    memoryRecallPolicy: metadata.memoryRecallPolicy ?? 'confirmed-user-memory',
    providerId: resolvedModel.reference.providerId,
    modelId: resolvedModel.reference.modelId,
    providerModelId: resolvedModel.providerModelId,
    modelSelectionSource: resolvedModel.source,
    memoryEnabled,
    knowledgeEnabled,
    knowledgeRetrievalProvider: metadata.knowledgeRetrievalProvider,
    knowledgeChunkCount: metadata.knowledgeChunkCount ?? 0,
    knowledgeCitationCount: metadata.knowledgeCitationCount ?? 0,
    systemPrompt,
  };
}

export function createMastraChatRequestContext(
  runtimeContext: AIRuntimeContext,
  resolvedModel: ResolvedModel,
  systemPrompt: string,
  memoryEnabled: boolean,
  knowledgeEnabled: boolean,
  metadata: Parameters<typeof createMastraChatRequestContextValue>[5] = {}
): MastraRequestContextLike<MastraChatRequestContextShape> {
  const value = createMastraChatRequestContextValue(
    runtimeContext,
    resolvedModel,
    systemPrompt,
    memoryEnabled,
    knowledgeEnabled,
    metadata
  );

  const requestContext =
    new AeloKitMastraRequestContext<MastraChatRequestContextShape>();
  requestContext.set('userId', value.userId);
  requestContext.set('threadId', value.threadId);
  requestContext.set('messageId', value.messageId);
  requestContext.set('memoryResourceId', value.memoryResourceId);
  requestContext.set('memoryThreadIds', value.memoryThreadIds);
  requestContext.set('memoryRecallPolicy', value.memoryRecallPolicy);
  requestContext.set('providerId', value.providerId);
  requestContext.set('modelId', value.modelId);
  requestContext.set('providerModelId', value.providerModelId);
  requestContext.set('modelSelectionSource', value.modelSelectionSource);
  requestContext.set('memoryEnabled', value.memoryEnabled);
  requestContext.set('knowledgeEnabled', value.knowledgeEnabled);
  requestContext.set(
    'knowledgeRetrievalProvider',
    value.knowledgeRetrievalProvider
  );
  requestContext.set('knowledgeChunkCount', value.knowledgeChunkCount);
  requestContext.set('knowledgeCitationCount', value.knowledgeCitationCount);
  requestContext.set('systemPrompt', value.systemPrompt);
  return requestContext;
}

export async function createDefaultMastraChatAgent(
  resolvedModel: ResolvedModel,
  tools: ToolSet
): Promise<MastraChatAgent> {
  const { Agent } = await import('@mastra/core/agent');

  return new Agent({
    id: 'aelokit-default-chat-agent',
    name: 'AeloKit Default Chat Agent',
    instructions: ({ requestContext }) =>
      requestContext.get('systemPrompt') as string,
    // Mastra accepts AI SDK-compatible models, but its public type surface is
    // broader than the concrete resolved model type we keep in app wiring.
    model: resolvedModel.model as never,
    tools: tools as never,
  }) as unknown as MastraChatAgent;
}

function normalizeAgentInstructions(
  instructions: Awaited<ReturnType<MastraChatAgent['getInstructions']>>
): string {
  if (typeof instructions === 'string') {
    return instructions;
  }

  if (Array.isArray(instructions)) {
    return instructions
      .map((message) => {
        if (typeof message === 'string') {
          return message;
        }

        const content = (message as { content?: unknown }).content;
        return typeof content === 'string' ? content : '';
      })
      .filter(Boolean)
      .join('\n\n');
  }

  const content = (instructions as { content?: unknown }).content;
  return typeof content === 'string' ? content : '';
}

async function resolveTools(
  tools: Record<string, unknown> | undefined,
  serverTools: ToolSet | undefined
): Promise<ToolSet> {
  let frontendToolSet: ToolSet = {};

  if (tools && Object.keys(tools).length > 0) {
    const { frontendTools } = await import('@assistant-ui/react-ai-sdk');
    frontendToolSet = frontendTools(
      tools as Parameters<typeof frontendTools>[0]
    );
  }

  return {
    ...frontendToolSet,
    ...(serverTools ?? {}),
  };
}

export async function createMastraChatAgentExecution(
  options: MastraChatAgentExecutionOptions
): Promise<MastraChatAgentExecution> {
  const requestContext = createMastraChatRequestContext(
    options.request.context,
    options.request.resolvedModel,
    options.systemPrompt,
    options.memoryEnabled,
    options.knowledgeEnabled,
    {
      memoryResourceId:
        options.memoryResourceId ?? options.request.context.userId,
      memoryThreadIds: options.memoryThreadIds ?? [],
      memoryRecallPolicy: options.memoryRecallPolicy ?? 'confirmed-user-memory',
      knowledgeRetrievalProvider: options.knowledgeRetrievalProvider,
      knowledgeChunkCount: options.knowledgeChunkCount,
      knowledgeCitationCount: options.knowledgeCitationCount,
    }
  );

  return {
    agent: await createDefaultMastraChatAgent(
      options.request.resolvedModel,
      options.tools
    ),
    requestContext,
  };
}

async function handleMastraToolChunk(
  chunk: ChunkType,
  options: Pick<MastraChatRunnerOptions, 'onToolCallStart' | 'onToolCallFinish'>
): Promise<void> {
  if (chunk.type === 'tool-call') {
    await options.onToolCallStart?.({
      toolCall: {
        toolCallId: chunk.payload.toolCallId,
        toolName: chunk.payload.toolName,
        input: chunk.payload.args,
        providerExecuted: chunk.payload.providerExecuted,
      },
    });
    return;
  }

  if (chunk.type === 'tool-result') {
    await options.onToolCallFinish?.({
      toolCall: {
        toolCallId: chunk.payload.toolCallId,
        toolName: chunk.payload.toolName,
        input: chunk.payload.args,
        providerExecuted: chunk.payload.providerExecuted,
      },
      success: !chunk.payload.isError,
      output: chunk.payload.result,
    });
    return;
  }

  if (chunk.type === 'tool-error') {
    await options.onToolCallFinish?.({
      toolCall: {
        toolCallId: chunk.payload.toolCallId,
        toolName: chunk.payload.toolName,
        input: chunk.payload.args,
        providerExecuted: chunk.payload.providerExecuted,
      },
      success: false,
      error: chunk.payload.error,
    });
  }
}

export async function runMastraChat(
  options: MastraChatRunnerOptions
): Promise<MastraChatRunnerResult> {
  const tools = await resolveTools(options.tools, options.serverTools);
  const executionOptions: MastraChatAgentExecutionOptions = {
    request: options.request,
    systemPrompt: options.systemPrompt,
    tools,
    memoryEnabled: options.memoryEnabled,
    memoryResourceId: options.memoryResourceId,
    memoryThreadIds: options.memoryThreadIds,
    memoryRecallPolicy: options.memoryRecallPolicy,
    knowledgeEnabled: options.knowledgeEnabled,
    knowledgeRetrievalProvider: options.knowledgeRetrievalProvider,
    knowledgeChunkCount: options.knowledgeChunkCount,
    knowledgeCitationCount: options.knowledgeCitationCount,
  };
  const execution = await (options.createAgentExecution?.(executionOptions) ??
    createMastraChatAgentExecution(executionOptions));
  const systemPrompt = normalizeAgentInstructions(
    await execution.agent.getInstructions({
      requestContext: execution.requestContext,
    })
  );

  const output = await execution.agent.stream(options.inputMessages, {
    requestContext: execution.requestContext,
    resourceId: execution.requestContext.get('memoryResourceId'),
    threadId: execution.requestContext.get('threadId'),
    abortSignal: options.abortSignal,
    onAbort: options.onAbort,
    onFinish: options.onFinish,
    onError: options.onError,
    onChunk: async (chunk) => {
      await options.onChunk?.(chunk);
      await handleMastraToolChunk(chunk, options);
    },
  });
  const stream =
    options.convertStream?.(output, {
      messageMetadata: options.messageMetadata,
    }) ??
    toAISdkStream(output, {
      from: 'agent',
      version: 'v6',
      messageMetadata: options.messageMetadata,
      onError: () => 'AI response failed while streaming.',
    });

  return {
    ...execution,
    systemPrompt,
    stream,
    output,
  };
}
