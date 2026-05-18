import { loadWorkspaceEnv } from '@repo/env/load';
import { eq, sql } from 'drizzle-orm';

const OPENAI_PROVIDER_ID = 'openai';
const DEFAULT_MODEL_ID = 'openai:gpt-5.4-mini';
const FRONTIER_MODEL_ID = 'openai:gpt-5.5';
const SYSTEM_AGENT_ID = 'system-default';
const SYSTEM_AGENT_SLUG = 'system-default';

const OPENAI_DOCUMENTATION_URL =
  'https://ai-sdk.dev/providers/ai-sdk-providers/openai';

const now = new Date();

async function seedAi() {
  loadWorkspaceEnv(import.meta.dirname);

  const [{ getDb }, { aiAgent, aiModel, aiProvider }] = await Promise.all([
    import('@repo/db'),
    import('@repo/db/schema'),
  ]);
  const db = await getDb();

  await db.transaction(async (tx) => {
    await tx
      .insert(aiProvider)
      .values({
        id: OPENAI_PROVIDER_ID,
        displayName: 'OpenAI',
        description: 'OpenAI direct provider path for AeloKit AI chat.',
        documentationUrl: OPENAI_DOCUMENTATION_URL,
        capabilities: ['chat', 'streaming', 'tool-calling'],
        status: 'enabled',
        sortOrder: 10,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: aiProvider.id,
        set: {
          displayName: 'OpenAI',
          description: 'OpenAI direct provider path for AeloKit AI chat.',
          documentationUrl: OPENAI_DOCUMENTATION_URL,
          capabilities: ['chat', 'streaming', 'tool-calling'],
          status: 'enabled',
          sortOrder: 10,
          updatedAt: now,
        },
      });

    await tx
      .update(aiModel)
      .set({
        isDefault: false,
        updatedAt: now,
      })
      .where(eq(aiModel.providerId, OPENAI_PROVIDER_ID));

    await tx
      .insert(aiModel)
      .values([
        {
          id: DEFAULT_MODEL_ID,
          providerId: OPENAI_PROVIDER_ID,
          providerModelId: 'gpt-5.4-mini',
          displayName: 'GPT-5.4 mini',
          description:
            'Lower-latency, lower-cost OpenAI model for the v0.2 first chat path.',
          capabilities: ['chat', 'streaming', 'tool-calling'],
          contextWindowTokens: 400_000,
          maxOutputTokens: 128_000,
          inputCostPerMillionTokens: '0.750000',
          outputCostPerMillionTokens: '4.500000',
          costCurrencyCode: 'USD',
          costMetadataUpdatedAt: now,
          status: 'enabled',
          isDefault: true,
          sortOrder: 10,
          updatedAt: now,
        },
        {
          id: FRONTIER_MODEL_ID,
          providerId: OPENAI_PROVIDER_ID,
          providerModelId: 'gpt-5.5',
          displayName: 'GPT-5.5',
          description:
            'OpenAI frontier model reserved for higher-capability chat selection.',
          capabilities: ['chat', 'streaming', 'tool-calling'],
          contextWindowTokens: 1_000_000,
          maxOutputTokens: 128_000,
          inputCostPerMillionTokens: '5.000000',
          outputCostPerMillionTokens: '30.000000',
          costCurrencyCode: 'USD',
          costMetadataUpdatedAt: now,
          status: 'enabled',
          isDefault: false,
          sortOrder: 20,
          updatedAt: now,
        },
      ])
      .onConflictDoUpdate({
        target: aiModel.id,
        set: {
          providerId: sql`excluded.provider_id`,
          providerModelId: sql`excluded.provider_model_id`,
          displayName: sql`excluded.display_name`,
          description: sql`excluded.description`,
          capabilities: sql`excluded.capabilities`,
          contextWindowTokens: sql`excluded.context_window_tokens`,
          maxOutputTokens: sql`excluded.max_output_tokens`,
          inputCostPerMillionTokens: sql`excluded.input_cost_per_million_tokens`,
          outputCostPerMillionTokens: sql`excluded.output_cost_per_million_tokens`,
          costCurrencyCode: sql`excluded.cost_currency_code`,
          costMetadataUpdatedAt: sql`excluded.cost_metadata_updated_at`,
          status: sql`excluded.status`,
          isDefault: sql`excluded.is_default`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
      });

    await tx
      .insert(aiAgent)
      .values({
        id: SYSTEM_AGENT_ID,
        slug: SYSTEM_AGENT_SLUG,
        displayName: 'AeloKit Assistant',
        description: 'Default system assistant for the v0.2 AI chat path.',
        instructions: {
          systemPrompt:
            'You are AeloKit Assistant. Help authenticated users with clear, concise, product-aware answers.',
          responseStyle: 'clear-concise',
          version: 'v0.2',
        },
        visibility: 'system',
        status: 'enabled',
        defaultProviderId: OPENAI_PROVIDER_ID,
        defaultModelId: DEFAULT_MODEL_ID,
        toolIds: [],
        skillIds: [],
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: aiAgent.id,
        set: {
          slug: SYSTEM_AGENT_SLUG,
          displayName: 'AeloKit Assistant',
          description: 'Default system assistant for the v0.2 AI chat path.',
          instructions: {
            systemPrompt:
              'You are AeloKit Assistant. Help authenticated users with clear, concise, product-aware answers.',
            responseStyle: 'clear-concise',
            version: 'v0.2',
          },
          visibility: 'system',
          status: 'enabled',
          defaultProviderId: OPENAI_PROVIDER_ID,
          defaultModelId: DEFAULT_MODEL_ID,
          toolIds: [],
          skillIds: [],
          updatedAt: now,
        },
      });
  });

  console.log(
    `AI seed completed: provider=${OPENAI_PROVIDER_ID}, defaultModel=${DEFAULT_MODEL_ID}, agent=${SYSTEM_AGENT_SLUG}`
  );
}

seedAi().catch((error) => {
  console.error('AI seed failed:', error);
  process.exit(1);
});
