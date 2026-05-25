import 'server-only';

import { getDb } from '@/db';
import { payment } from '@/db/schema';
import { findPlanByPriceId, getAllPricePlans } from '@/lib/price-plan';
import { aiEntitlementPolicy } from '@repo/db/ai-schema';
import { and, desc, eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export interface AIPlanEntitlementPolicy {
  readonly id: string;
  readonly planId: string;
  readonly status: 'enabled' | 'disabled';
  readonly allowedModelIds: readonly string[];
  readonly knowledgeEnabled: boolean;
  readonly memoryEnabled: boolean;
  readonly toolsEnabled: boolean;
  readonly maxCreditsPerRequest: number | null;
  readonly monthlyCredits: number | null;
  readonly updatedAt: string;
}

function normalizeAllowedModelIds(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function toPolicy(
  row: typeof aiEntitlementPolicy.$inferSelect
): AIPlanEntitlementPolicy {
  return {
    id: row.id,
    planId: row.planId,
    status: row.status as 'enabled' | 'disabled',
    allowedModelIds: normalizeAllowedModelIds(row.allowedModelIds),
    knowledgeEnabled: row.knowledgeEnabled,
    memoryEnabled: row.memoryEnabled,
    toolsEnabled: row.toolsEnabled,
    maxCreditsPerRequest: row.maxCreditsPerRequest,
    monthlyCredits: row.monthlyCredits,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function getDefaultPolicyForPlan(
  planId: string
): Omit<AIPlanEntitlementPolicy, 'id' | 'updatedAt'> {
  const plan = getAllPricePlans().find((candidate) => candidate.id === planId);
  const monthlyCredits = plan?.credits?.enable ? plan.credits.amount : null;

  return {
    planId,
    status: 'enabled',
    allowedModelIds: [],
    knowledgeEnabled: !plan?.isFree,
    memoryEnabled: true,
    toolsEnabled: !plan?.isFree,
    maxCreditsPerRequest: plan?.isFree ? 3 : null,
    monthlyCredits,
  };
}

export async function ensureAIEntitlementPolicies(): Promise<void> {
  const db = await getDb();
  const now = new Date();

  for (const plan of getAllPricePlans()) {
    const defaultPolicy = getDefaultPolicyForPlan(plan.id);
    await db
      .insert(aiEntitlementPolicy)
      .values({
        id: nanoid(),
        planId: plan.id,
        status: defaultPolicy.status,
        allowedModelIds: [...defaultPolicy.allowedModelIds],
        knowledgeEnabled: defaultPolicy.knowledgeEnabled,
        memoryEnabled: defaultPolicy.memoryEnabled,
        toolsEnabled: defaultPolicy.toolsEnabled,
        maxCreditsPerRequest: defaultPolicy.maxCreditsPerRequest,
        monthlyCredits: defaultPolicy.monthlyCredits,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({
        target: aiEntitlementPolicy.planId,
      });
  }
}

export async function listAIEntitlementPolicies(): Promise<
  readonly AIPlanEntitlementPolicy[]
> {
  await ensureAIEntitlementPolicies();

  const db = await getDb();
  const rows = await db
    .select()
    .from(aiEntitlementPolicy)
    .orderBy(aiEntitlementPolicy.planId);

  return rows.map(toPolicy);
}

export async function updateAIEntitlementPolicy(input: {
  readonly planId: string;
  readonly status: 'enabled' | 'disabled';
  readonly allowedModelIds: readonly string[];
  readonly knowledgeEnabled: boolean;
  readonly memoryEnabled: boolean;
  readonly toolsEnabled: boolean;
  readonly maxCreditsPerRequest: number | null;
}): Promise<AIPlanEntitlementPolicy> {
  await ensureAIEntitlementPolicies();

  const db = await getDb();
  const now = new Date();
  const [updated] = await db
    .update(aiEntitlementPolicy)
    .set({
      status: input.status,
      allowedModelIds: [...input.allowedModelIds],
      knowledgeEnabled: input.knowledgeEnabled,
      memoryEnabled: input.memoryEnabled,
      toolsEnabled: input.toolsEnabled,
      maxCreditsPerRequest: input.maxCreditsPerRequest,
      updatedAt: now,
    })
    .where(eq(aiEntitlementPolicy.planId, input.planId))
    .returning();

  if (!updated) {
    throw new Error(
      `AI entitlement policy for plan "${input.planId}" not found.`
    );
  }

  return toPolicy(updated);
}

async function resolveUserPlanId(userId: string): Promise<string> {
  const db = await getDb();
  const plans = getAllPricePlans();
  const freePlan = plans.find((plan) => plan.isFree && !plan.disabled);
  const rows = await db
    .select({
      priceId: payment.priceId,
      type: payment.type,
      scene: payment.scene,
      status: payment.status,
    })
    .from(payment)
    .where(
      and(
        eq(payment.paid, true),
        eq(payment.userId, userId),
        or(
          and(
            eq(payment.type, 'one_time'),
            eq(payment.scene, 'lifetime'),
            eq(payment.status, 'completed')
          ),
          and(
            eq(payment.type, 'subscription'),
            or(eq(payment.status, 'active'), eq(payment.status, 'trialing'))
          )
        )
      )
    )
    .orderBy(desc(payment.createdAt));

  for (const row of rows) {
    const plan = findPlanByPriceId(row.priceId);
    if (plan) {
      return plan.id;
    }
  }

  return freePlan?.id ?? 'free';
}

export async function getAIEntitlementPolicyForUser(
  userId: string
): Promise<AIPlanEntitlementPolicy> {
  await ensureAIEntitlementPolicies();

  const db = await getDb();
  const planId = await resolveUserPlanId(userId);
  const [policy] = await db
    .select()
    .from(aiEntitlementPolicy)
    .where(eq(aiEntitlementPolicy.planId, planId))
    .limit(1);

  if (policy) {
    return toPolicy(policy);
  }

  const fallback = getDefaultPolicyForPlan(planId);
  return {
    id: `default:${planId}`,
    updatedAt: new Date(0).toISOString(),
    ...fallback,
  };
}
