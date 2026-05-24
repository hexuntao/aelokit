import type { ModelMessage, ToolSet, UIMessage } from 'ai';
import type { AIRuntimeContext } from '../context';
import type { ResolvedModel } from '../models';
import type { ChatRuntimeRequest } from '../runtime';

export interface MastraChatRequestContextShape {
  readonly userId: string;
  readonly threadId: string;
  readonly messageId: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly providerModelId: string;
  readonly modelSelectionSource: string;
  readonly memoryEnabled: boolean;
  readonly knowledgeEnabled: boolean;
  readonly systemPrompt: string;
}

export interface MastraChatRunnerOptions {
  readonly request: ChatRuntimeRequest;
  readonly inputMessages: readonly UIMessage[];
  readonly systemPrompt: string;
  readonly tools?: Record<string, unknown>;
  readonly memoryEnabled: boolean;
  readonly knowledgeEnabled: boolean;
  readonly abortSignal?: AbortSignal;
  readonly onAbort?: () => Promise<void> | void;
  readonly executeStream?: typeof import('ai').streamText;
  readonly convertMessages?: (
    messages: readonly UIMessage[]
  ) => Promise<ModelMessage[]> | ModelMessage[];
  readonly createAgentExecution?: (
    options: Pick<
      MastraChatRunnerOptions,
      'request' | 'systemPrompt' | 'memoryEnabled' | 'knowledgeEnabled'
    >
  ) => Promise<MastraChatAgentExecution> | MastraChatAgentExecution;
}

export interface MastraRequestContextLike<TShape extends Record<string, any>> {
  set<TKey extends keyof TShape>(key: TKey, value: TShape[TKey]): void;
  get<TKey extends keyof TShape>(key: TKey): TShape[TKey] | undefined;
}

export interface MastraChatAgentLike {
  getInstructions(options: {
    requestContext: MastraRequestContextLike<MastraChatRequestContextShape>;
  }): Promise<unknown> | unknown;
}

export interface MastraChatAgentExecution {
  readonly agent: MastraChatAgentLike;
  readonly requestContext: MastraRequestContextLike<MastraChatRequestContextShape>;
}

export interface MastraChatRunnerResult extends MastraChatAgentExecution {
  readonly systemPrompt: string;
  readonly result: ReturnType<typeof import('ai').streamText>;
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
  knowledgeEnabled: boolean
): MastraChatRequestContextShape {
  return {
    userId: runtimeContext.userId,
    threadId: runtimeContext.threadId ?? '',
    messageId: runtimeContext.messageId ?? '',
    providerId: resolvedModel.reference.providerId,
    modelId: resolvedModel.reference.modelId,
    providerModelId: resolvedModel.providerModelId,
    modelSelectionSource: resolvedModel.source,
    memoryEnabled,
    knowledgeEnabled,
    systemPrompt,
  };
}

export function createMastraChatRequestContext(
  runtimeContext: AIRuntimeContext,
  resolvedModel: ResolvedModel,
  systemPrompt: string,
  memoryEnabled: boolean,
  knowledgeEnabled: boolean
): MastraRequestContextLike<MastraChatRequestContextShape> {
  const value = createMastraChatRequestContextValue(
    runtimeContext,
    resolvedModel,
    systemPrompt,
    memoryEnabled,
    knowledgeEnabled
  );

  const requestContext =
    new AeloKitMastraRequestContext<MastraChatRequestContextShape>();
  requestContext.set('userId', value.userId);
  requestContext.set('threadId', value.threadId);
  requestContext.set('messageId', value.messageId);
  requestContext.set('providerId', value.providerId);
  requestContext.set('modelId', value.modelId);
  requestContext.set('providerModelId', value.providerModelId);
  requestContext.set('modelSelectionSource', value.modelSelectionSource);
  requestContext.set('memoryEnabled', value.memoryEnabled);
  requestContext.set('knowledgeEnabled', value.knowledgeEnabled);
  requestContext.set('systemPrompt', value.systemPrompt);
  return requestContext;
}

export async function createDefaultMastraChatAgent(
  resolvedModel: ResolvedModel
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
  });
}

function normalizeAgentInstructions(
  instructions: Awaited<ReturnType<MastraChatAgent['getInstructions']>>
): string {
  if (typeof instructions === 'string') {
    return instructions;
  }

  if (Array.isArray(instructions)) {
    return instructions
      .map((message) =>
        typeof message === 'string'
          ? message
          : typeof message.content === 'string'
            ? message.content
            : ''
      )
      .filter(Boolean)
      .join('\n\n');
  }

  return typeof instructions === 'string'
    ? instructions
    : typeof instructions.content === 'string'
      ? instructions.content
      : '';
}

async function resolveStreamText(
  executeStream?: typeof import('ai').streamText
) {
  if (executeStream) {
    return executeStream;
  }

  const { streamText } = await import('ai');
  return streamText;
}

async function resolveModelMessages(
  inputMessages: readonly UIMessage[],
  convertMessages?: MastraChatRunnerOptions['convertMessages']
): Promise<ModelMessage[]> {
  if (convertMessages) {
    return convertMessages(inputMessages);
  }

  const { convertToModelMessages } = await import('ai');
  return (await convertToModelMessages([...inputMessages])) as ModelMessage[];
}

async function resolveTools(
  tools: Record<string, unknown> | undefined
): Promise<ToolSet> {
  if (!tools || Object.keys(tools).length === 0) {
    return {};
  }

  const { frontendTools } = await import('@assistant-ui/react-ai-sdk');
  return frontendTools(tools as Parameters<typeof frontendTools>[0]);
}

export async function createMastraChatAgentExecution(
  options: Pick<
    MastraChatRunnerOptions,
    'request' | 'systemPrompt' | 'memoryEnabled' | 'knowledgeEnabled'
  >
): Promise<MastraChatAgentExecution> {
  const requestContext = createMastraChatRequestContext(
    options.request.context,
    options.request.resolvedModel,
    options.systemPrompt,
    options.memoryEnabled,
    options.knowledgeEnabled
  );

  return {
    agent: await createDefaultMastraChatAgent(options.request.resolvedModel),
    requestContext,
  };
}

export async function runMastraChat(
  options: MastraChatRunnerOptions
): Promise<MastraChatRunnerResult> {
  const execution = await (options.createAgentExecution?.(options) ??
    createMastraChatAgentExecution(options));
  const systemPrompt = normalizeAgentInstructions(
    await execution.agent.getInstructions({
      requestContext: execution.requestContext,
    })
  );
  const executeStream = await resolveStreamText(options.executeStream);
  const modelMessages = await resolveModelMessages(
    options.inputMessages,
    options.convertMessages
  );
  const tools = await resolveTools(options.tools);

  const result = executeStream({
    model: options.request.resolvedModel.model,
    system: systemPrompt,
    messages: modelMessages,
    tools,
    abortSignal: options.abortSignal,
    onAbort: options.onAbort,
  });

  return {
    ...execution,
    systemPrompt,
    result,
  };
}
