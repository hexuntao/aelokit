import type { AIAgentReference } from '../../agents';
import type { AIError } from '../../errors';
import type { AIMcpServerReference, AIMcpToolReference } from '../../mcp';
import type { AIMemoryReference, AIMemoryRecallReference } from '../../memory';
import type { AIModelReference } from '../../models';
import type { AIPermissionDecision } from '../../permissions';
import type { AIToolCallStatus, AIToolDefinitionId } from '../../tools';

export type AIMastraAgentId = string;

export type AIMastraToolId = string;

export type AIMastraWorkflowId = string;

export type AIMastraWorkflowRunId = string;

export type AIMastraMemoryId = string;

export type AIMastraMcpServerId = string;

export type AIMastraSerializableMetadata = Readonly<Record<string, unknown>>;

export type AIMastraAgentCapability =
  | 'chat'
  | 'tool-use'
  | 'workflow-orchestration'
  | 'memory'
  | 'mcp';

export type AIMastraWorkflowStatus =
  | 'defined'
  | 'queued-reserved'
  | 'running-reserved'
  | 'succeeded-reserved'
  | 'failed-reserved'
  | 'cancelled-reserved';

export type AIMastraBridgeKind =
  | 'agent'
  | 'tool'
  | 'workflow'
  | 'memory'
  | 'mcp';

export interface AIMastraBridgeMetadata {
  readonly kind: AIMastraBridgeKind;
  readonly adapterVersion?: string;
  readonly metadata?: AIMastraSerializableMetadata;
}

export interface AIMastraAgentBridge {
  readonly mastraAgentId: AIMastraAgentId;
  readonly coreAgent: AIAgentReference;
  readonly model?: AIModelReference;
  readonly capabilities: ReadonlyArray<AIMastraAgentCapability>;
  readonly tools?: ReadonlyArray<AIMastraToolBridgeReference>;
  readonly workflows?: ReadonlyArray<AIMastraWorkflowBridgeReference>;
  readonly memory?: AIMastraMemoryBridgeReference;
  readonly mcpServers?: ReadonlyArray<AIMastraMcpServerBridgeReference>;
  // Bridge types map future Mastra concepts to AeloKit contracts; they never hold a live agent instance.
  readonly bridge: AIMastraBridgeMetadata;
}

export interface AIMastraToolBridge {
  readonly mastraToolId: AIMastraToolId;
  readonly coreToolId: AIToolDefinitionId;
  readonly name: string;
  readonly description?: string;
  readonly permission?: AIPermissionDecision;
  // Tool input and output stay unknown until app/runtime layers validate schemas and execute side effects.
  readonly input?: unknown;
  readonly output?: unknown;
  readonly bridge: AIMastraBridgeMetadata;
}

export interface AIMastraToolBridgeReference {
  readonly mastraToolId: AIMastraToolId;
  readonly coreToolId: AIToolDefinitionId;
}

export interface AIMastraToolCallBridge {
  readonly callId: string;
  readonly tool: AIMastraToolBridgeReference;
  readonly status: AIToolCallStatus;
  readonly permission?: AIPermissionDecision;
  readonly input?: unknown;
  readonly output?: unknown;
  readonly error?: AIError;
}

export interface AIMastraWorkflowStepBridge {
  readonly id: string;
  readonly name: string;
  readonly tool?: AIMastraToolBridgeReference;
  readonly agent?: AIAgentReference;
  readonly metadata?: AIMastraSerializableMetadata;
}

export interface AIMastraWorkflowBridge {
  readonly mastraWorkflowId: AIMastraWorkflowId;
  readonly name: string;
  readonly description?: string;
  readonly steps: ReadonlyArray<AIMastraWorkflowStepBridge>;
  readonly status: AIMastraWorkflowStatus;
  // Workflow support is a reserve for future orchestration, not a v0.1 executable runtime.
  readonly bridge: AIMastraBridgeMetadata;
}

export interface AIMastraWorkflowBridgeReference {
  readonly mastraWorkflowId: AIMastraWorkflowId;
}

export interface AIMastraWorkflowRunBridge {
  readonly runId: AIMastraWorkflowRunId;
  readonly workflow: AIMastraWorkflowBridgeReference;
  readonly status: AIMastraWorkflowStatus;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly error?: AIError;
  readonly metadata?: AIMastraSerializableMetadata;
}

export interface AIMastraMemoryBridge {
  readonly mastraMemoryId: AIMastraMemoryId;
  readonly coreMemory?: AIMemoryReference;
  readonly recalls?: ReadonlyArray<AIMemoryRecallReference>;
  readonly agent?: AIAgentReference;
  // Memory bridge state is contract metadata only; persistence and consolidation stay out of v0.1.
  readonly bridge: AIMastraBridgeMetadata;
}

export interface AIMastraMemoryBridgeReference {
  readonly mastraMemoryId: AIMastraMemoryId;
  readonly coreMemoryId?: AIMemoryReference['memoryId'];
}

export interface AIMastraMcpServerBridge {
  readonly mastraMcpServerId: AIMastraMcpServerId;
  readonly coreServer: AIMcpServerReference;
  readonly tools?: ReadonlyArray<AIMcpToolReference>;
  readonly permission?: AIPermissionDecision;
  readonly bridge: AIMastraBridgeMetadata;
}

export interface AIMastraMcpServerBridgeReference {
  readonly mastraMcpServerId: AIMastraMcpServerId;
  readonly coreServerId: AIMcpServerReference['serverId'];
}

export interface AIMastraBridgeSurface {
  readonly agents: ReadonlyArray<AIMastraAgentBridge>;
  readonly tools: ReadonlyArray<AIMastraToolBridge>;
  readonly workflows: ReadonlyArray<AIMastraWorkflowBridge>;
  readonly memories: ReadonlyArray<AIMastraMemoryBridge>;
  readonly mcpServers: ReadonlyArray<AIMastraMcpServerBridge>;
  // This surface is structural and runtime-free, so @mastra/core remains an unconfirmed dependency.
  readonly metadata?: AIMastraSerializableMetadata;
}
