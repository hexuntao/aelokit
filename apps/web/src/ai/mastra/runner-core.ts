import { frontendTools } from '@assistant-ui/react-ai-sdk';
import { Agent } from '@mastra/core/agent';
import { RequestContext } from '@mastra/core/di';
import {
  convertToModelMessages,
  streamText,
  type ModelMessage,
  type UIMessage,
} from 'ai';
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
  readonly executeStream?: typeof streamText;
}

export interface MastraChatAgentExecution {
  readonly agent: Agent<
    string,
    Record<string, never>,
    undefined,
    MastraChatRequestContextShape
  >;
  readonly requestContext: RequestContext<MastraChatRequestContextShape>;
}

export interface MastraChatRunnerResult extends MastraChatAgentExecution {
  readonly systemPrompt: string;
  readonly result: ReturnType<typeof streamText>;
}

type MastraChatAgent = MastraChatAgentExecution['agent'];

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
): RequestContext<MastraChatRequestContextShape> {
  const value = createMastraChatRequestContextValue(
    runtimeContext,
    resolvedModel,
    systemPrompt,
    memoryEnabled,
    knowledgeEnabled
  );

  const requestContext = new RequestContext<MastraChatRequestContextShape>();
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

export function createDefaultMastraChatAgent(
  resolvedModel: ResolvedModel
): MastraChatAgent {
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

export function createMastraChatAgentExecution(
  options: Pick<
    MastraChatRunnerOptions,
    'request' | 'systemPrompt' | 'memoryEnabled' | 'knowledgeEnabled'
  >
): MastraChatAgentExecution {
  const requestContext = createMastraChatRequestContext(
    options.request.context,
    options.request.resolvedModel,
    options.systemPrompt,
    options.memoryEnabled,
    options.knowledgeEnabled
  );

  return {
    agent: createDefaultMastraChatAgent(options.request.resolvedModel),
    requestContext,
  };
}

export async function runMastraChat(
  options: MastraChatRunnerOptions
): Promise<MastraChatRunnerResult> {
  const execution = createMastraChatAgentExecution(options);
  const systemPrompt = normalizeAgentInstructions(
    await execution.agent.getInstructions({
      requestContext:
        execution.requestContext as unknown as RequestContext<unknown>,
    })
  );
  const executeStream = options.executeStream ?? streamText;
  const modelMessages = (await convertToModelMessages([
    ...options.inputMessages,
  ])) as ModelMessage[];

  const result = executeStream({
    model: options.request.resolvedModel.model,
    system: systemPrompt,
    messages: modelMessages,
    tools: frontendTools(
      (options.tools ?? {}) as Parameters<typeof frontendTools>[0]
    ),
    abortSignal: options.abortSignal,
    onAbort: options.onAbort,
  });

  return {
    ...execution,
    systemPrompt,
    result,
  };
}
