import assert from 'node:assert/strict';
import test from 'node:test';
import type { UIMessage, UIMessageChunk } from 'ai';
import type { ChunkType, MastraModelOutput } from '@mastra/core/stream';
import { createMastraChatRequestContext, runMastraChat } from './runner-core';
import type { ChatRuntimeRequest } from '../runtime';

function createRuntimeRequest(): ChatRuntimeRequest {
  return {
    messages: [
      {
        id: 'user-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello from the test runner.' }],
      } as UIMessage,
    ],
    context: {
      session: {
        user: {
          id: 'user-1',
        },
      } as never,
      userId: 'user-1',
      locale: 'en',
      requestedAt: new Date('2026-05-24T00:00:00.000Z'),
      threadId: 'thread-1',
      messageId: 'message-1',
    },
    resolvedModel: {
      model: { modelId: 'gpt-5.5' } as never,
      reference: {
        providerId: 'openai',
        modelId: 'gpt-5.5',
      },
      source: 'thread',
      providerModelId: 'gpt-5.5',
    },
  };
}

function createMockMastraOutput(): MastraModelOutput<unknown> {
  return {
    mocked: true,
  } as unknown as MastraModelOutput<unknown>;
}

function createMockUIStream(): ReadableStream<UIMessageChunk> {
  return new ReadableStream<UIMessageChunk>({
    start(controller) {
      controller.close();
    },
  });
}

test('creates a Mastra request context with model source and feature flags', () => {
  const request = createRuntimeRequest();
  const requestContext = createMastraChatRequestContext(
    request.context,
    request.resolvedModel,
    'System prompt',
    true,
    false
  );

  assert.equal(requestContext.get('userId'), 'user-1');
  assert.equal(requestContext.get('threadId'), 'thread-1');
  assert.equal(requestContext.get('memoryResourceId'), 'user-1');
  assert.equal(
    requestContext.get('memoryRecallPolicy'),
    'confirmed-user-memory'
  );
  assert.equal(requestContext.get('memoryMode'), 'confirmed-context-only');
  assert.equal(typeof requestContext.get('memoryFallbackReason'), 'string');
  assert.equal(requestContext.get('modelSelectionSource'), 'thread');
  assert.equal(requestContext.get('memoryEnabled'), true);
  assert.equal(requestContext.get('knowledgeEnabled'), false);
  assert.equal(requestContext.get('knowledgeChunkCount'), 0);
  assert.equal(requestContext.get('knowledgeCitationCount'), 0);
  assert.equal(requestContext.get('systemPrompt'), 'System prompt');
});

test('builds Mastra chat request context with request-context-backed instructions', async () => {
  const request = createRuntimeRequest();
  const requestContext = createMastraChatRequestContext(
    request.context,
    request.resolvedModel,
    'Prompt from context',
    false,
    true
  );
  const agent = {
    getInstructions: ({
      requestContext: currentContext,
    }: {
      requestContext: typeof requestContext;
    }) => currentContext.get('systemPrompt'),
  };

  const instructions = await agent.getInstructions({ requestContext });

  assert.equal(instructions, 'Prompt from context');
  assert.equal(requestContext.get('knowledgeEnabled'), true);
});

test('runs the Mastra chat runner with resolved prompt and UI messages', async () => {
  const request = createRuntimeRequest();
  const captured: {
    messages?: unknown;
    abortSignal?: AbortSignal;
    tools?: unknown;
  } = {};

  const result = await runMastraChat({
    request,
    inputMessages: [
      ...request.messages,
      {
        id: 'assistant-memory-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Remembered context' }],
      } as UIMessage,
    ],
    systemPrompt: 'Base system prompt\n\nKnowledge context block',
    serverTools: {
      inspectKnowledge: {} as never,
    },
    memoryEnabled: true,
    memoryResourceId: 'user-1',
    memoryThreadIds: ['memory-thread-1'],
    memoryRecallPolicy: 'confirmed-user-memory',
    knowledgeEnabled: true,
    knowledgeRetrievalProvider: 'mastra-pgvector',
    knowledgeChunkCount: 1,
    knowledgeCitationCount: 1,
    abortSignal: new AbortController().signal,
    createAgentExecution: (executionOptions) => {
      const requestContext = createMastraChatRequestContext(
        request.context,
        request.resolvedModel,
        'Base system prompt\n\nKnowledge context block',
        true,
        true,
        {
          memoryResourceId: executionOptions.memoryResourceId,
          memoryThreadIds: executionOptions.memoryThreadIds,
          memoryRecallPolicy: executionOptions.memoryRecallPolicy,
          knowledgeRetrievalProvider:
            executionOptions.knowledgeRetrievalProvider,
          knowledgeChunkCount: executionOptions.knowledgeChunkCount,
          knowledgeCitationCount: executionOptions.knowledgeCitationCount,
        }
      );

      return {
        agent: {
          getInstructions: ({ requestContext: currentContext }) =>
            currentContext.get('systemPrompt'),
          stream: async (messages, options) => {
            captured.messages = messages;
            captured.abortSignal = options.abortSignal;
            return createMockMastraOutput();
          },
        },
        requestContext,
      };
    },
    convertStream: () => createMockUIStream(),
  });

  assert.ok(Array.isArray(captured.messages));
  assert.equal((captured.messages as UIMessage[]).length, 2);
  assert.equal(
    result.systemPrompt,
    'Base system prompt\n\nKnowledge context block'
  );
  assert.ok(result.stream instanceof ReadableStream);
  assert.equal(result.requestContext.get('modelSelectionSource'), 'thread');
  assert.equal(result.requestContext.get('memoryEnabled'), true);
  assert.equal(
    result.requestContext.get('memoryMode'),
    'confirmed-context-only'
  );
  assert.match(
    result.requestContext.get('memoryFallbackReason') ?? '',
    /auto-persistence/
  );
  assert.deepEqual(result.requestContext.get('memoryThreadIds'), [
    'memory-thread-1',
  ]);
  assert.equal(result.requestContext.get('knowledgeEnabled'), true);
  assert.equal(
    result.requestContext.get('knowledgeRetrievalProvider'),
    'mastra-pgvector'
  );
  assert.equal(result.requestContext.get('knowledgeChunkCount'), 1);
  assert.equal(result.requestContext.get('knowledgeCitationCount'), 1);
});

test('ignores unregistered client tools and only passes registry tools to Agent', async () => {
  const request = createRuntimeRequest();
  const captured: {
    toolNames?: readonly string[];
  } = {};

  await runMastraChat({
    request,
    inputMessages: request.messages,
    systemPrompt: 'System prompt',
    tools: {
      clientWriteTool: {
        description: 'A client supplied tool that must not reach the agent.',
      },
    },
    serverTools: {
      inspectKnowledge: {} as never,
    },
    memoryEnabled: false,
    knowledgeEnabled: true,
    createAgentExecution: (executionOptions) => {
      captured.toolNames = Object.keys(executionOptions.tools);
      const requestContext = createMastraChatRequestContext(
        request.context,
        request.resolvedModel,
        'System prompt',
        false,
        true
      );

      return {
        agent: {
          getInstructions: ({ requestContext: currentContext }) =>
            currentContext.get('systemPrompt'),
          stream: async () => createMockMastraOutput(),
        },
        requestContext,
      };
    },
    convertStream: () => createMockUIStream(),
  });

  assert.deepEqual(captured.toolNames, ['inspectKnowledge']);
});

test('passes no tools to Agent when only client tools were requested', async () => {
  const request = createRuntimeRequest();
  const captured: {
    toolNames?: readonly string[];
  } = {};

  await runMastraChat({
    request,
    inputMessages: request.messages,
    systemPrompt: 'System prompt',
    tools: {
      clientOnlyTool: {
        description: 'This client tool is not registered.',
      },
    },
    memoryEnabled: false,
    knowledgeEnabled: false,
    createAgentExecution: (executionOptions) => {
      captured.toolNames = Object.keys(executionOptions.tools);
      const requestContext = createMastraChatRequestContext(
        request.context,
        request.resolvedModel,
        'System prompt',
        false,
        false
      );

      return {
        agent: {
          getInstructions: ({ requestContext: currentContext }) =>
            currentContext.get('systemPrompt'),
          stream: async () => createMockMastraOutput(),
        },
        requestContext,
      };
    },
    convertStream: () => createMockUIStream(),
  });

  assert.deepEqual(captured.toolNames, []);
});

test('passes abort, finish, and error callbacks through to Mastra agent stream', async () => {
  const request = createRuntimeRequest();
  const callbacks: {
    onAbort?: unknown;
    onFinish?: unknown;
    onError?: unknown;
  } = {};

  await runMastraChat({
    request,
    inputMessages: request.messages,
    systemPrompt: 'System prompt',
    memoryEnabled: false,
    knowledgeEnabled: false,
    onAbort: async () => {},
    onFinish: async () => {},
    onError: async () => {},
    createAgentExecution: () => {
      const requestContext = createMastraChatRequestContext(
        request.context,
        request.resolvedModel,
        'System prompt',
        false,
        false
      );

      return {
        agent: {
          getInstructions: ({ requestContext: currentContext }) =>
            currentContext.get('systemPrompt'),
          stream: async (_messages, options) => {
            callbacks.onAbort = options.onAbort;
            callbacks.onFinish = options.onFinish;
            callbacks.onError = options.onError;
            return createMockMastraOutput();
          },
        },
        requestContext,
      };
    },
    convertStream: () => createMockUIStream(),
  });

  assert.equal(typeof callbacks.onAbort, 'function');
  assert.equal(typeof callbacks.onFinish, 'function');
  assert.equal(typeof callbacks.onError, 'function');
});

test('maps Mastra tool chunks to existing tool audit callbacks', async () => {
  const request = createRuntimeRequest();
  const events: string[] = [];

  await runMastraChat({
    request,
    inputMessages: request.messages,
    systemPrompt: 'System prompt',
    memoryEnabled: false,
    knowledgeEnabled: false,
    onToolCallStart: async ({ toolCall }) => {
      events.push(`start:${toolCall.toolCallId}:${toolCall.toolName}`);
    },
    onToolCallFinish: async ({ toolCall, success, output }) => {
      events.push(
        `finish:${toolCall.toolCallId}:${toolCall.toolName}:${success}:${String(
          output
        )}`
      );
    },
    createAgentExecution: () => {
      const requestContext = createMastraChatRequestContext(
        request.context,
        request.resolvedModel,
        'System prompt',
        false,
        false
      );

      return {
        agent: {
          getInstructions: ({ requestContext: currentContext }) =>
            currentContext.get('systemPrompt'),
          stream: async (_messages, options) => {
            await options.onChunk?.({
              type: 'tool-call',
              payload: {
                toolCallId: 'tool-call-1',
                toolName: 'inspectKnowledge',
                args: { limit: 1 },
                providerExecuted: false,
              },
            } as unknown as ChunkType);
            await options.onChunk?.({
              type: 'tool-result',
              payload: {
                toolCallId: 'tool-call-1',
                toolName: 'inspectKnowledge',
                result: 'done',
                isError: false,
                providerExecuted: false,
              },
            } as unknown as ChunkType);
            return createMockMastraOutput();
          },
        },
        requestContext,
      };
    },
    convertStream: () => createMockUIStream(),
  });

  assert.deepEqual(events, [
    'start:tool-call-1:inspectKnowledge',
    'finish:tool-call-1:inspectKnowledge:true:done',
  ]);
});
