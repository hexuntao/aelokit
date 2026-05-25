import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { aiAgent } from '@repo/db/ai-schema';

export interface AppLocalAgentOption {
  readonly id: string;
  readonly slug: string;
  readonly label: string;
  readonly description: string;
}

export interface AppLocalAgentDefinition {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly description: string;
  readonly instructions: string;
  readonly allowedToolIds: readonly string[];
  readonly defaultModelId?: string;
  readonly features: {
    readonly memory: boolean;
    readonly knowledge: boolean;
    readonly tools: boolean;
  };
}

export interface ResolvedAgentSelection {
  readonly agent: AppLocalAgentDefinition;
  readonly requestedAgentId?: string;
  readonly fallbackFromUnknown: boolean;
}

const APP_LOCAL_AGENTS: readonly AppLocalAgentDefinition[] = [
  {
    id: 'agent-default-chat',
    slug: 'default-chat',
    displayName: 'Default Chat Agent',
    description: 'General-purpose assistant for normal workspace chat.',
    instructions:
      'You are AeloKit’s default AI workspace assistant. Be helpful, accurate, and practical. Prefer clear answers, preserve citations when available, and use tools only when they are explicitly enabled.',
    allowedToolIds: ['tool-knowledge-inspection'],
    defaultModelId: 'gpt-5.5',
    features: {
      memory: true,
      knowledge: true,
      tools: true,
    },
  },
  {
    id: 'agent-knowledge-focused',
    slug: 'knowledge-focused',
    displayName: 'Knowledge-Focused Agent',
    description: 'Answers with a stronger preference for cited knowledge.',
    instructions:
      'You are a knowledge-grounded assistant. Prioritize retrieved knowledge, explicitly connect claims to available citations, and avoid unsupported assertions when the knowledge layer is enabled.',
    allowedToolIds: ['tool-knowledge-inspection'],
    defaultModelId: 'gpt-4.1',
    features: {
      memory: false,
      knowledge: true,
      tools: true,
    },
  },
  {
    id: 'agent-concise-assistant',
    slug: 'concise-assistant',
    displayName: 'Concise Assistant',
    description: 'Short, direct answers with minimal elaboration.',
    instructions:
      'You are a concise assistant. Answer directly, keep responses short unless the user asks for detail, and avoid unnecessary preamble.',
    allowedToolIds: [],
    defaultModelId: 'gpt-4.1-mini',
    features: {
      memory: false,
      knowledge: false,
      tools: false,
    },
  },
] as const;

export const DEFAULT_AGENT_ID = APP_LOCAL_AGENTS[0].id;

export function getAppLocalAgentCatalog(): readonly AppLocalAgentDefinition[] {
  return APP_LOCAL_AGENTS;
}

export function getDefaultAgent(): AppLocalAgentDefinition {
  return APP_LOCAL_AGENTS[0];
}

export function getSelectableAgentOptions(): readonly AppLocalAgentOption[] {
  return APP_LOCAL_AGENTS.map((agent) => ({
    id: agent.id,
    slug: agent.slug,
    label: agent.displayName,
    description: agent.description,
  }));
}

export function resolveAgentSelection(options?: {
  readonly requestedAgentId?: string;
  readonly threadAgentId?: string;
}): ResolvedAgentSelection {
  const candidateIds = [options?.requestedAgentId, options?.threadAgentId];

  for (const candidateId of candidateIds) {
    if (!candidateId) {
      continue;
    }

    const matchedAgent = APP_LOCAL_AGENTS.find(
      (agent) => agent.id === candidateId
    );
    if (matchedAgent) {
      return {
        agent: matchedAgent,
        requestedAgentId: options?.requestedAgentId,
        fallbackFromUnknown: false,
      };
    }
  }

  return {
    agent: getDefaultAgent(),
    requestedAgentId: options?.requestedAgentId,
    fallbackFromUnknown: Boolean(options?.requestedAgentId),
  };
}

export async function ensureAIAgentCatalog(): Promise<void> {
  const db = await getDb();
  const now = new Date();

  for (const agent of APP_LOCAL_AGENTS) {
    await db
      .insert(aiAgent)
      .values({
        id: agent.id,
        slug: agent.slug,
        displayName: agent.displayName,
        description: agent.description,
        instructions: {
          systemPrompt: agent.instructions,
          features: agent.features,
        },
        visibility: 'system',
        status: 'enabled',
        defaultProviderId: 'openai',
        defaultModelId: agent.defaultModelId ?? null,
        toolIds: [...agent.allowedToolIds],
        skillIds: [],
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: aiAgent.id,
        set: {
          slug: agent.slug,
          displayName: agent.displayName,
          description: agent.description,
          instructions: {
            systemPrompt: agent.instructions,
            features: agent.features,
          },
          visibility: 'system',
          status: 'enabled',
          defaultProviderId: 'openai',
          defaultModelId: agent.defaultModelId ?? null,
          toolIds: [...agent.allowedToolIds],
          updatedAt: now,
        },
      });
  }
}

export async function getAgentById(
  agentId: string
): Promise<AppLocalAgentDefinition | null> {
  await ensureAIAgentCatalog();

  const db = await getDb();
  const [row] = await db
    .select()
    .from(aiAgent)
    .where(eq(aiAgent.id, agentId))
    .limit(1);

  if (!row) {
    return null;
  }

  return APP_LOCAL_AGENTS.find((agent) => agent.id === row.id) ?? null;
}
