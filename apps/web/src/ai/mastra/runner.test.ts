import assert from 'node:assert/strict';
import test from 'node:test';
import type { UIMessage } from 'ai';
import {
  createMastraChatAgentExecution,
  createMastraChatRequestContext,
  runMastraChat,
} from './runner-core';
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
  assert.equal(requestContext.get('modelSelectionSource'), 'thread');
  assert.equal(requestContext.get('memoryEnabled'), true);
  assert.equal(requestContext.get('knowledgeEnabled'), false);
  assert.equal(requestContext.get('systemPrompt'), 'System prompt');
});

test('builds the default Mastra chat agent with request-context-backed instructions', async () => {
  const request = createRuntimeRequest();
  const execution = createMastraChatAgentExecution({
    request,
    systemPrompt: 'Prompt from context',
    memoryEnabled: false,
    knowledgeEnabled: true,
  });

  const instructions = await execution.agent.getInstructions({
    requestContext: execution.requestContext as never,
  });

  assert.equal(instructions, 'Prompt from context');
  assert.equal(execution.requestContext.get('knowledgeEnabled'), true);
});

test('runs the Mastra chat runner with resolved prompt and converted messages', async () => {
  const request = createRuntimeRequest();
  const captured: {
    model?: unknown;
    system?: string;
    messages?: unknown;
    abortSignal?: AbortSignal;
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
    memoryEnabled: true,
    knowledgeEnabled: true,
    abortSignal: new AbortController().signal,
    executeStream: ((options) => {
      captured.model = options.model;
      captured.system =
        typeof options.system === 'string'
          ? options.system
          : Array.isArray(options.system)
            ? options.system
                .map((message) =>
                  typeof message.content === 'string' ? message.content : ''
                )
                .join('\n\n')
            : typeof options.system?.content === 'string'
              ? options.system.content
              : '';
      captured.messages = options.messages;
      captured.abortSignal = options.abortSignal;
      return { mocked: true } as unknown as ReturnType<
        typeof import('ai').streamText
      >;
    }) as typeof import('ai').streamText,
  });

  assert.equal(captured.model, request.resolvedModel.model);
  assert.equal(
    captured.system,
    'Base system prompt\n\nKnowledge context block'
  );
  assert.ok(Array.isArray(captured.messages));
  assert.equal((captured.messages as Array<{ role: string }>).length, 2);
  assert.equal(
    result.systemPrompt,
    'Base system prompt\n\nKnowledge context block'
  );
  assert.equal(result.requestContext.get('modelSelectionSource'), 'thread');
  assert.equal(result.requestContext.get('memoryEnabled'), true);
  assert.equal(result.requestContext.get('knowledgeEnabled'), true);
});
