export type AIToolDefinitionId = string;

export type AIToolInputBoundary = unknown;

export type AIToolOutputBoundary = unknown;

export type AIToolCapability =
  | 'read'
  | 'write'
  | 'search'
  | 'retrieve'
  | 'transform'
  | 'external-action';

export type AIToolPermissionScope =
  | 'knowledge:read'
  | 'memory:read'
  | 'mcp:read'
  | 'mcp:execute'
  | 'workflow:read'
  | 'workflow:execute';

export type AIToolPermissionMode = 'read' | 'write' | 'execute' | 'admin';

export type AIToolSchemaValidationMode = 'none' | 'runtime' | 'provider';

export type AIToolCallStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'error'
  | 'timeout';

export type AIToolCallStatusMapping = {
  readonly contractToDb: {
    readonly pending: 'pending';
    readonly running: 'running';
    readonly success: 'success';
    readonly error: 'error';
    readonly timeout: 'timeout';
  };
  readonly dbToContract: {
    readonly pending: 'pending';
    readonly running: 'running';
    readonly success: 'success';
    readonly error: 'error';
    readonly timeout: 'timeout';
  };
};

export const AITOOL_CALL_STATUS_MAPPING: AIToolCallStatusMapping = {
  contractToDb: {
    pending: 'pending',
    running: 'running',
    success: 'success',
    error: 'error',
    timeout: 'timeout',
  },
  dbToContract: {
    pending: 'pending',
    running: 'running',
    success: 'success',
    error: 'error',
    timeout: 'timeout',
  },
};

export interface AIToolDisplayMetadata {
  readonly name: string;
  readonly description?: string;
}

export interface AIToolInputMetadata {
  readonly description?: string;
  readonly contentType?: string;
}

export interface AIToolOutputMetadata {
  readonly description?: string;
  readonly contentType?: string;
}

export interface AIToolDefinition {
  readonly id: AIToolDefinitionId;
  readonly name: string;
  readonly display: AIToolDisplayMetadata;
  readonly capabilities: ReadonlyArray<AIToolCapability>;
  // Input and output stay unknown until app/runtime layers validate schemas.
  readonly input: AIToolInputMetadata;
  readonly output: AIToolOutputMetadata;
}

export interface AIToolPermissionRequirement {
  readonly scope: AIToolPermissionScope;
  readonly mode: AIToolPermissionMode;
  readonly resourceKind?: string;
}

export interface AIToolSchemaValidationPolicy {
  readonly input: AIToolSchemaValidationMode;
  readonly output: AIToolSchemaValidationMode;
}

export interface AIMCPToolCompatibility {
  readonly compatible: boolean;
  readonly name?: string;
  readonly serverName?: string;
}

export interface AIToolRegistryEntry extends AIToolDefinition {
  readonly permissions: ReadonlyArray<AIToolPermissionRequirement>;
  readonly schemaValidation: AIToolSchemaValidationPolicy;
  readonly mcp: AIMCPToolCompatibility;
}

export interface AIToolExecutionContext {
  readonly toolId: AIToolDefinitionId;
  readonly callId: string;
}

export interface AIToolExecutionSurface {
  readonly input: AIToolInputBoundary;
  readonly output: AIToolOutputBoundary;
}

export interface AIToolCallLifecycleReference {
  readonly toolId: AIToolDefinitionId;
  readonly callId: string;
  readonly status: AIToolCallStatus;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly failureReason?: string;
}
