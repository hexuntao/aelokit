'use server';

import {
  ensureAIEntitlementPolicies,
  listAIEntitlementPolicies,
  updateAIEntitlementPolicy,
  type AIPlanEntitlementPolicy,
} from '@/ai/entitlements/plan-policy';
import { ensureAIAgentCatalog } from '@/ai/agents';
import { ensureAIModelCatalog, listSelectableModelOptions } from '@/ai/models';
import { getDb } from '@/db';
import { aiAgent, aiModel, aiProvider } from '@repo/db/ai-schema';
import { adminActionClient } from '@/lib/safe-action';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

export interface AIProductControlState {
  readonly models: readonly {
    readonly providerId: string;
    readonly modelId: string;
    readonly label: string;
    readonly isDefault: boolean;
  }[];
  readonly agents: readonly {
    readonly id: string;
    readonly slug: string;
    readonly displayName: string;
    readonly visibility: string;
    readonly status: string;
  }[];
  readonly policies: readonly AIPlanEntitlementPolicy[];
}

type AIProductControlMutationResult =
  | { readonly success: true }
  | { readonly success: false; readonly error: string };

const defaultModelSchema = z.object({
  providerId: z.string().min(1),
  modelId: z.string().min(1),
});

const agentControlSchema = z.object({
  agentId: z.string().min(1),
  visibility: z.enum(['system', 'public', 'private']),
  status: z.enum(['enabled', 'disabled', 'deprecated']),
});

const entitlementPolicySchema = z.object({
  planId: z.string().min(1),
  status: z.enum(['enabled', 'disabled']),
  allowedModelIds: z.array(z.string()).default([]),
  knowledgeEnabled: z.boolean(),
  memoryEnabled: z.boolean(),
  toolsEnabled: z.boolean(),
  maxCreditsPerRequest: z.number().int().positive().nullable(),
});

export const getAIProductControlStateAction = adminActionClient.action(
  async (): Promise<
    | { readonly success: true; readonly data: AIProductControlState }
    | { readonly success: false; readonly error: string }
  > => {
    try {
      await Promise.all([
        ensureAIModelCatalog(),
        ensureAIAgentCatalog(),
        ensureAIEntitlementPolicies(),
      ]);

      const db = await getDb();
      const [modelOptions, agentRows, policies] = await Promise.all([
        listSelectableModelOptions(),
        db
          .select({
            id: aiAgent.id,
            slug: aiAgent.slug,
            displayName: aiAgent.displayName,
            visibility: aiAgent.visibility,
            status: aiAgent.status,
          })
          .from(aiAgent)
          .orderBy(aiAgent.slug),
        listAIEntitlementPolicies(),
      ]);
      const defaultRows = await db
        .select({
          providerId: aiModel.providerId,
          modelId: aiModel.id,
        })
        .from(aiModel)
        .innerJoin(aiProvider, eq(aiProvider.id, aiModel.providerId))
        .where(
          and(eq(aiModel.isDefault, true), eq(aiProvider.status, 'enabled'))
        );
      const defaultIds = new Set(
        defaultRows.map((row) => `${row.providerId}:${row.modelId}`)
      );

      return {
        success: true,
        data: {
          models: modelOptions.map((model) => ({
            providerId: model.providerId,
            modelId: model.modelId,
            label: model.label,
            isDefault: defaultIds.has(`${model.providerId}:${model.modelId}`),
          })),
          agents: agentRows,
          policies,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load AI product controls.',
      };
    }
  }
);

export const updateDefaultAIModelAction = adminActionClient
  .inputSchema(defaultModelSchema)
  .action(async ({ parsedInput }) => {
    const db = await getDb();
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(aiModel)
        .set({ isDefault: false, updatedAt: now })
        .where(eq(aiModel.providerId, parsedInput.providerId));

      await tx
        .update(aiModel)
        .set({ isDefault: true, updatedAt: now })
        .where(
          and(
            eq(aiModel.providerId, parsedInput.providerId),
            eq(aiModel.id, parsedInput.modelId)
          )
        );
    });

    return { success: true as const };
  });

export const updateAIAgentControlAction = adminActionClient
  .inputSchema(agentControlSchema)
  .action(async ({ parsedInput }): Promise<AIProductControlMutationResult> => {
    const db = await getDb();

    const updatedRows = await db
      .update(aiAgent)
      .set({
        visibility: parsedInput.visibility,
        status: parsedInput.status,
        updatedAt: new Date(),
      })
      .where(eq(aiAgent.id, parsedInput.agentId))
      .returning({ id: aiAgent.id });

    if (updatedRows.length === 0) {
      return {
        success: false,
        error: `Agent "${parsedInput.agentId}" was not found.`,
      };
    }

    return { success: true as const };
  });

export const updateAIEntitlementPolicyAction = adminActionClient
  .inputSchema(entitlementPolicySchema)
  .action(async ({ parsedInput }) => {
    const policy = await updateAIEntitlementPolicy(parsedInput);
    return {
      success: true as const,
      data: policy,
    };
  });
