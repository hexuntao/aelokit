import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  type AnyPgColumn,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

const emptyArray = sql`'[]'::jsonb`;
const emptyObject = sql`'{}'::jsonb`;

export const aiProvider = pgTable(
  'ai_provider',
  {
    id: text('id').primaryKey(),
    displayName: text('display_name').notNull(),
    description: text('description'),
    documentationUrl: text('documentation_url'),
    capabilities: jsonb('capabilities').notNull().default(emptyArray),
    status: text('status').notNull().default('enabled'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    aiProviderStatusIdx: index('ai_provider_status_idx').on(table.status),
    aiProviderSortOrderIdx: index('ai_provider_sort_order_idx').on(
      table.sortOrder
    ),
    aiProviderStatusCheck: check(
      'ai_provider_status_check',
      sql`${table.status} in ('enabled', 'disabled', 'deprecated')`
    ),
  })
);

export const aiModel = pgTable(
  'ai_model',
  {
    id: text('id').primaryKey(),
    providerId: text('provider_id')
      .notNull()
      .references(() => aiProvider.id, { onDelete: 'restrict' }),
    providerModelId: text('provider_model_id').notNull(),
    displayName: text('display_name').notNull(),
    description: text('description'),
    capabilities: jsonb('capabilities').notNull().default(emptyArray),
    contextWindowTokens: integer('context_window_tokens'),
    maxOutputTokens: integer('max_output_tokens'),
    inputCostPerMillionTokens: numeric('input_cost_per_million_tokens', {
      precision: 12,
      scale: 6,
    }),
    outputCostPerMillionTokens: numeric('output_cost_per_million_tokens', {
      precision: 12,
      scale: 6,
    }),
    cachedInputCostPerMillionTokens: numeric(
      'cached_input_cost_per_million_tokens',
      {
        precision: 12,
        scale: 6,
      }
    ),
    costCurrencyCode: text('cost_currency_code'),
    costMetadataUpdatedAt: timestamp('cost_metadata_updated_at'),
    status: text('status').notNull().default('enabled'),
    isDefault: boolean('is_default').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    aiModelProviderIdIdx: index('ai_model_provider_id_idx').on(
      table.providerId
    ),
    aiModelStatusIdx: index('ai_model_status_idx').on(table.status),
    aiModelProviderStatusIdx: index('ai_model_provider_status_idx').on(
      table.providerId,
      table.status
    ),
    aiModelSortOrderIdx: index('ai_model_sort_order_idx').on(table.sortOrder),
    aiModelProviderModelIdUidx: uniqueIndex(
      'ai_model_provider_model_id_uidx'
    ).on(table.providerId, table.providerModelId),
    aiModelProviderIdIdUidx: uniqueIndex('ai_model_provider_id_id_uidx').on(
      table.providerId,
      table.id
    ),
    aiModelProviderDefaultUidx: uniqueIndex('ai_model_provider_default_uidx')
      .on(table.providerId)
      .where(sql`${table.isDefault} = true`),
    aiModelStatusCheck: check(
      'ai_model_status_check',
      sql`${table.status} in ('enabled', 'disabled', 'deprecated')`
    ),
  })
);

export const aiUserModelSetting = pgTable(
  'ai_user_model_setting',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    providerId: text('provider_id')
      .notNull()
      .references(() => aiProvider.id, { onDelete: 'restrict' }),
    modelId: text('model_id')
      .notNull()
      .references(() => aiModel.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    aiUserModelSettingProviderModelIdx: index(
      'ai_user_model_setting_provider_model_idx'
    ).on(table.providerId, table.modelId),
    aiUserModelSettingUserIdUidx: uniqueIndex(
      'ai_user_model_setting_user_id_uidx'
    ).on(table.userId),
    aiUserModelSettingProviderModelFk: foreignKey({
      name: 'ai_user_model_setting_provider_model_fk',
      columns: [table.providerId, table.modelId],
      foreignColumns: [aiModel.providerId, aiModel.id],
    }).onDelete('restrict'),
  })
);

export const aiAgent = pgTable(
  'ai_agent',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    displayName: text('display_name').notNull(),
    description: text('description'),
    instructions: jsonb('instructions').notNull().default(emptyObject),
    visibility: text('visibility').notNull().default('system'),
    status: text('status').notNull().default('enabled'),
    defaultProviderId: text('default_provider_id').references(
      () => aiProvider.id,
      { onDelete: 'restrict' }
    ),
    defaultModelId: text('default_model_id').references(() => aiModel.id, {
      onDelete: 'restrict',
    }),
    toolIds: jsonb('tool_ids').notNull().default(emptyArray),
    skillIds: jsonb('skill_ids').notNull().default(emptyArray),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    aiAgentVisibilityStatusIdx: index('ai_agent_visibility_status_idx').on(
      table.visibility,
      table.status
    ),
    aiAgentDefaultModelIdx: index('ai_agent_default_model_idx').on(
      table.defaultProviderId,
      table.defaultModelId
    ),
    aiAgentSlugUidx: uniqueIndex('ai_agent_slug_uidx').on(table.slug),
    aiAgentDefaultModelFk: foreignKey({
      name: 'ai_agent_default_model_fk',
      columns: [table.defaultProviderId, table.defaultModelId],
      foreignColumns: [aiModel.providerId, aiModel.id],
    }).onDelete('restrict'),
    aiAgentVisibilityCheck: check(
      'ai_agent_visibility_check',
      sql`${table.visibility} in ('system', 'public', 'private')`
    ),
    aiAgentStatusCheck: check(
      'ai_agent_status_check',
      sql`${table.status} in ('enabled', 'disabled', 'deprecated')`
    ),
  })
);

export const aiThread = pgTable(
  'ai_thread',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    agentId: text('agent_id').references(() => aiAgent.id, {
      onDelete: 'set null',
    }),
    providerId: text('provider_id').references(() => aiProvider.id, {
      onDelete: 'restrict',
    }),
    modelId: text('model_id').references(() => aiModel.id, {
      onDelete: 'restrict',
    }),
    title: text('title'),
    status: text('status').notNull().default('active'),
    metadata: jsonb('metadata').notNull().default(emptyObject),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    aiThreadUserStatusUpdatedIdx: index('ai_thread_user_status_updated_idx').on(
      table.userId,
      table.status,
      table.updatedAt
    ),
    aiThreadUserCreatedIdx: index('ai_thread_user_created_idx').on(
      table.userId,
      table.createdAt
    ),
    aiThreadAgentIdIdx: index('ai_thread_agent_id_idx').on(table.agentId),
    aiThreadModelIdx: index('ai_thread_model_idx').on(
      table.providerId,
      table.modelId
    ),
    aiThreadModelFk: foreignKey({
      name: 'ai_thread_model_fk',
      columns: [table.providerId, table.modelId],
      foreignColumns: [aiModel.providerId, aiModel.id],
    }).onDelete('restrict'),
    aiThreadStatusCheck: check(
      'ai_thread_status_check',
      sql`${table.status} in ('active', 'archived', 'deleted')`
    ),
  })
);

export const aiMessage = pgTable(
  'ai_message',
  {
    id: text('id').primaryKey(),
    threadId: text('thread_id')
      .notNull()
      .references(() => aiThread.id, { onDelete: 'cascade' }),
    parentMessageId: text('parent_message_id').references(
      (): AnyPgColumn => aiMessage.id,
      { onDelete: 'set null' }
    ),
    role: text('role').notNull(),
    runtimeFormat: text('runtime_format').notNull().default('aisdk-v6'),
    status: text('status').notNull().default('complete'),
    sortOrder: integer('sort_order').notNull(),
    metadata: jsonb('metadata').notNull().default(emptyObject),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    aiMessageThreadSortIdx: index('ai_message_thread_sort_idx').on(
      table.threadId,
      table.sortOrder
    ),
    aiMessageThreadCreatedIdx: index('ai_message_thread_created_idx').on(
      table.threadId,
      table.createdAt
    ),
    aiMessageParentIdIdx: index('ai_message_parent_id_idx').on(
      table.parentMessageId
    ),
    aiMessageStatusIdx: index('ai_message_status_idx').on(table.status),
    aiMessageThreadSortUidx: uniqueIndex('ai_message_thread_sort_uidx').on(
      table.threadId,
      table.sortOrder
    ),
    aiMessageRoleCheck: check(
      'ai_message_role_check',
      sql`${table.role} in ('system', 'user', 'assistant', 'tool')`
    ),
    aiMessageRuntimeFormatCheck: check(
      'ai_message_runtime_format_check',
      sql`${table.runtimeFormat} = 'aisdk-v6'`
    ),
    aiMessageStatusCheck: check(
      'ai_message_status_check',
      sql`${table.status} in ('streaming', 'complete', 'error', 'aborted')`
    ),
  })
);

export const aiToolCall = pgTable(
  'ai_tool_call',
  {
    id: text('id').primaryKey(),
    threadId: text('thread_id')
      .notNull()
      .references(() => aiThread.id, { onDelete: 'cascade' }),
    messageId: text('message_id')
      .notNull()
      .references(() => aiMessage.id, { onDelete: 'cascade' }),
    toolName: text('tool_name').notNull(),
    toolId: text('tool_id'),
    status: text('status').notNull().default('pending'),
    input: jsonb('input'),
    output: jsonb('output'),
    providerExecuted: boolean('provider_executed').notNull().default(false),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    aiToolCallThreadCreatedIdx: index('ai_tool_call_thread_created_idx').on(
      table.threadId,
      table.createdAt
    ),
    aiToolCallMessageIdIdx: index('ai_tool_call_message_id_idx').on(
      table.messageId
    ),
    aiToolCallStatusIdx: index('ai_tool_call_status_idx').on(table.status),
    aiToolCallToolNameIdx: index('ai_tool_call_tool_name_idx').on(
      table.toolName
    ),
    aiToolCallStatusCheck: check(
      'ai_tool_call_status_check',
      sql`${table.status} in ('pending', 'running', 'success', 'error', 'timeout')`
    ),
  })
);

export const aiWorkflowRun = pgTable(
  'ai_workflow_run',
  {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id').notNull(),
    workflowName: text('workflow_name').notNull(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    threadId: text('thread_id').references(() => aiThread.id, {
      onDelete: 'set null',
    }),
    messageId: text('message_id').references(() => aiMessage.id, {
      onDelete: 'set null',
    }),
    status: text('status').notNull().default('queued'),
    inputMetadata: jsonb('input_metadata').notNull().default(emptyObject),
    outputMetadata: jsonb('output_metadata').notNull().default(emptyObject),
    failureReason: text('failure_reason'),
    retryCount: integer('retry_count').notNull().default(0),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    aiWorkflowRunWorkflowCreatedIdx: index(
      'ai_workflow_run_workflow_created_idx'
    ).on(table.workflowId, table.createdAt),
    aiWorkflowRunUserCreatedIdx: index('ai_workflow_run_user_created_idx').on(
      table.userId,
      table.createdAt
    ),
    aiWorkflowRunThreadCreatedIdx: index(
      'ai_workflow_run_thread_created_idx'
    ).on(table.threadId, table.createdAt),
    aiWorkflowRunStatusCreatedIdx: index(
      'ai_workflow_run_status_created_idx'
    ).on(table.status, table.createdAt),
    aiWorkflowRunMessageIdIdx: index('ai_workflow_run_message_id_idx').on(
      table.messageId
    ),
    aiWorkflowRunStatusCheck: check(
      'ai_workflow_run_status_check',
      sql`${table.status} in ('queued', 'running', 'succeeded', 'failed', 'retrying', 'cancelled')`
    ),
  })
);

export const aiMessagePart = pgTable(
  'ai_message_part',
  {
    id: text('id').primaryKey(),
    messageId: text('message_id')
      .notNull()
      .references(() => aiMessage.id, { onDelete: 'cascade' }),
    partType: text('part_type').notNull(),
    runtimePartType: text('runtime_part_type').notNull(),
    content: jsonb('content').notNull().default(emptyObject),
    toolCallId: text('tool_call_id').references(() => aiToolCall.id, {
      onDelete: 'set null',
    }),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    aiMessagePartMessageSortIdx: index('ai_message_part_message_sort_idx').on(
      table.messageId,
      table.sortOrder
    ),
    aiMessagePartTypeIdx: index('ai_message_part_type_idx').on(table.partType),
    aiMessagePartToolCallIdIdx: index('ai_message_part_tool_call_id_idx').on(
      table.toolCallId
    ),
    aiMessagePartMessageSortUidx: uniqueIndex(
      'ai_message_part_message_sort_uidx'
    ).on(table.messageId, table.sortOrder),
    aiMessagePartTypeCheck: check(
      'ai_message_part_type_check',
      sql`${table.partType} in ('text', 'reasoning', 'tool-call', 'tool-result', 'file', 'image', 'source', 'data')`
    ),
  })
);

export const aiUsage = pgTable(
  'ai_usage',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    threadId: text('thread_id').references(() => aiThread.id, {
      onDelete: 'set null',
    }),
    messageId: text('message_id').references(() => aiMessage.id, {
      onDelete: 'set null',
    }),
    providerId: text('provider_id')
      .notNull()
      .references(() => aiProvider.id, { onDelete: 'restrict' }),
    modelId: text('model_id')
      .notNull()
      .references(() => aiModel.id, { onDelete: 'restrict' }),
    providerModelId: text('provider_model_id'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    totalTokens: integer('total_tokens'),
    cachedInputTokens: integer('cached_input_tokens'),
    reasoningTokens: integer('reasoning_tokens'),
    estimatedCostUsd: numeric('estimated_cost_usd', {
      precision: 12,
      scale: 6,
    }),
    costCurrencyCode: text('cost_currency_code'),
    costEstimateSource: text('cost_estimate_source'),
    status: text('status').notNull(),
    failureReason: text('failure_reason'),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    requestDurationMs: integer('request_duration_ms'),
    rawUsage: jsonb('raw_usage'),
    providerMetadata: jsonb('provider_metadata'),
    billingMode: text('billing_mode').notNull().default('audit_only'),
    billingStatus: text('billing_status').notNull().default('audit_only'),
    billingReference: jsonb('billing_reference').notNull().default(emptyObject),
    requestedAt: timestamp('requested_at').notNull().defaultNow(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    aiUsageUserCreatedIdx: index('ai_usage_user_created_idx').on(
      table.userId,
      table.createdAt
    ),
    aiUsageThreadCreatedIdx: index('ai_usage_thread_created_idx').on(
      table.threadId,
      table.createdAt
    ),
    aiUsageMessageIdIdx: index('ai_usage_message_id_idx').on(table.messageId),
    aiUsageProviderModelCreatedIdx: index(
      'ai_usage_provider_model_created_idx'
    ).on(table.providerId, table.modelId, table.createdAt),
    aiUsageStatusCreatedIdx: index('ai_usage_status_created_idx').on(
      table.status,
      table.createdAt
    ),
    aiUsageProviderModelFk: foreignKey({
      name: 'ai_usage_provider_model_fk',
      columns: [table.providerId, table.modelId],
      foreignColumns: [aiModel.providerId, aiModel.id],
    }).onDelete('restrict'),
    aiUsageStatusCheck: check(
      'ai_usage_status_check',
      sql`${table.status} in ('success', 'error', 'timeout', 'rate_limited')`
    ),
    aiUsageCostEstimateSourceCheck: check(
      'ai_usage_cost_estimate_source_check',
      sql`${table.costEstimateSource} is null or ${table.costEstimateSource} in ('model-metadata', 'provider-reported', 'manual-estimate', 'unknown')`
    ),
    aiUsageBillingModeCheck: check(
      'ai_usage_billing_mode_check',
      sql`${table.billingMode} in ('audit_only', 'credits')`
    ),
    aiUsageBillingStatusCheck: check(
      'ai_usage_billing_status_check',
      sql`${table.billingStatus} in ('audit_only', 'preflight_passed', 'preflight_failed', 'reserved', 'reservation_failed', 'settled', 'settlement_failed', 'refunded', 'refund_failed', 'no_charge', 'cancelled', 'timeout', 'rate_limited')`
    ),
  })
);

export const aiCostEvent = pgTable(
  'ai_cost_event',
  {
    id: text('id').primaryKey(),
    usageId: text('usage_id')
      .notNull()
      .references(() => aiUsage.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    providerId: text('provider_id')
      .notNull()
      .references(() => aiProvider.id, { onDelete: 'restrict' }),
    modelId: text('model_id')
      .notNull()
      .references(() => aiModel.id, { onDelete: 'restrict' }),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    totalTokens: integer('total_tokens'),
    estimatedCostUsd: numeric('estimated_cost_usd', {
      precision: 12,
      scale: 6,
    }),
    estimatedCredits: integer('estimated_credits'),
    currencyCode: text('currency_code'),
    source: text('source').notNull().default('unknown'),
    status: text('status').notNull().default('estimated'),
    metadata: jsonb('metadata').notNull().default(emptyObject),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    aiCostEventUsageIdIdx: index('ai_cost_event_usage_id_idx').on(
      table.usageId
    ),
    aiCostEventUserCreatedIdx: index('ai_cost_event_user_created_idx').on(
      table.userId,
      table.createdAt
    ),
    aiCostEventProviderModelCreatedIdx: index(
      'ai_cost_event_provider_model_created_idx'
    ).on(table.providerId, table.modelId, table.createdAt),
    aiCostEventStatusCreatedIdx: index('ai_cost_event_status_created_idx').on(
      table.status,
      table.createdAt
    ),
    aiCostEventProviderModelFk: foreignKey({
      name: 'ai_cost_event_provider_model_fk',
      columns: [table.providerId, table.modelId],
      foreignColumns: [aiModel.providerId, aiModel.id],
    }).onDelete('restrict'),
    aiCostEventSourceCheck: check(
      'ai_cost_event_source_check',
      sql`${table.source} in ('model-metadata', 'provider-reported', 'manual-estimate', 'unknown')`
    ),
    aiCostEventStatusCheck: check(
      'ai_cost_event_status_check',
      sql`${table.status} in ('estimated', 'final', 'failed', 'no_charge')`
    ),
  })
);

export const aiObservabilityEvent = pgTable(
  'ai_observability_event',
  {
    id: text('id').primaryKey(),
    eventType: text('event_type').notNull(),
    severity: text('severity').notNull().default('info'),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    workflowRunId: text('workflow_run_id').references(() => aiWorkflowRun.id, {
      onDelete: 'set null',
    }),
    usageId: text('usage_id').references(() => aiUsage.id, {
      onDelete: 'set null',
    }),
    threadId: text('thread_id').references(() => aiThread.id, {
      onDelete: 'set null',
    }),
    messageId: text('message_id').references(() => aiMessage.id, {
      onDelete: 'set null',
    }),
    metadata: jsonb('metadata').notNull().default(emptyObject),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    aiObservabilityEventTypeCreatedIdx: index(
      'ai_observability_event_type_created_idx'
    ).on(table.eventType, table.createdAt),
    aiObservabilityEventSeverityCreatedIdx: index(
      'ai_observability_event_severity_created_idx'
    ).on(table.severity, table.createdAt),
    aiObservabilityEventWorkflowCreatedIdx: index(
      'ai_observability_event_workflow_created_idx'
    ).on(table.workflowRunId, table.createdAt),
    aiObservabilityEventUsageCreatedIdx: index(
      'ai_observability_event_usage_created_idx'
    ).on(table.usageId, table.createdAt),
    aiObservabilityEventUserCreatedIdx: index(
      'ai_observability_event_user_created_idx'
    ).on(table.userId, table.createdAt),
    aiObservabilityEventSeverityCheck: check(
      'ai_observability_event_severity_check',
      sql`${table.severity} in ('debug', 'info', 'warn', 'error')`
    ),
  })
);

export const aiEvalResult = pgTable(
  'ai_eval_result',
  {
    id: text('id').primaryKey(),
    workflowRunId: text('workflow_run_id').references(() => aiWorkflowRun.id, {
      onDelete: 'cascade',
    }),
    scorerId: text('scorer_id').notNull(),
    status: text('status').notNull().default('skipped'),
    score: numeric('score', { precision: 8, scale: 4 }),
    metadata: jsonb('metadata').notNull().default(emptyObject),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    aiEvalResultWorkflowCreatedIdx: index(
      'ai_eval_result_workflow_created_idx'
    ).on(table.workflowRunId, table.createdAt),
    aiEvalResultScorerCreatedIdx: index('ai_eval_result_scorer_created_idx').on(
      table.scorerId,
      table.createdAt
    ),
    aiEvalResultStatusCreatedIdx: index('ai_eval_result_status_created_idx').on(
      table.status,
      table.createdAt
    ),
    aiEvalResultStatusCheck: check(
      'ai_eval_result_status_check',
      sql`${table.status} in ('passed', 'failed', 'skipped', 'error')`
    ),
  })
);

export const aiCreditReservation = pgTable(
  'ai_credit_reservation',
  {
    id: text('id').primaryKey(),
    usageId: text('usage_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    reservationStatus: text('reservation_status').notNull().default('reserved'),
    settlementStatus: text('settlement_status').notNull().default('pending'),
    refundStatus: text('refund_status').notNull().default('not_required'),
    reservedCredits: integer('reserved_credits').notNull().default(0),
    settledCredits: integer('settled_credits'),
    refundedCredits: integer('refunded_credits'),
    creditAllocations: jsonb('credit_allocations')
      .notNull()
      .default(emptyArray),
    failureReason: text('failure_reason'),
    expiresAt: timestamp('expires_at'),
    reservedAt: timestamp('reserved_at'),
    settledAt: timestamp('settled_at'),
    refundedAt: timestamp('refunded_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    aiCreditReservationUsageIdIdx: index(
      'ai_credit_reservation_usage_id_idx'
    ).on(table.usageId),
    aiCreditReservationUserCreatedIdx: index(
      'ai_credit_reservation_user_created_idx'
    ).on(table.userId, table.createdAt),
    aiCreditReservationStatusIdx: index('ai_credit_reservation_status_idx').on(
      table.reservationStatus,
      table.settlementStatus,
      table.refundStatus
    ),
    aiCreditReservationUsageIdUidx: uniqueIndex(
      'ai_credit_reservation_usage_id_uidx'
    ).on(table.usageId),
    aiCreditReservationReservationStatusCheck: check(
      'ai_credit_reservation_reservation_status_check',
      sql`${table.reservationStatus} in ('preflight_passed', 'preflight_failed', 'reserved', 'reservation_failed', 'cancelled', 'timeout', 'rate_limited')`
    ),
    aiCreditReservationSettlementStatusCheck: check(
      'ai_credit_reservation_settlement_status_check',
      sql`${table.settlementStatus} in ('pending', 'settled', 'settlement_failed', 'no_charge', 'cancelled', 'timeout', 'rate_limited')`
    ),
    aiCreditReservationRefundStatusCheck: check(
      'ai_credit_reservation_refund_status_check',
      sql`${table.refundStatus} in ('not_required', 'refunded', 'refund_failed', 'no_charge', 'cancelled')`
    ),
  })
);

export const aiMemoryDraft = pgTable(
  'ai_memory_draft',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title'),
    content: text('content').notNull(),
    status: text('status').notNull().default('pending'),
    disabled: boolean('disabled').notNull().default(false),
    mastraThreadId: text('mastra_thread_id'),
    mastraMessageId: text('mastra_message_id'),
    metadata: jsonb('metadata').notNull().default(emptyObject),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    confirmedAt: timestamp('confirmed_at'),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    aiMemoryDraftUserStatusIdx: index('ai_memory_draft_user_status_idx').on(
      table.userId,
      table.status
    ),
    aiMemoryDraftUserCreatedIdx: index('ai_memory_draft_user_created_idx').on(
      table.userId,
      table.createdAt
    ),
    aiMemoryDraftMastraThreadUidx: uniqueIndex(
      'ai_memory_draft_mastra_thread_uidx'
    )
      .on(table.mastraThreadId)
      .where(sql`${table.mastraThreadId} is not null`),
    aiMemoryDraftStatusCheck: check(
      'ai_memory_draft_status_check',
      sql`${table.status} in ('pending', 'confirmed', 'deleted')`
    ),
  })
);
