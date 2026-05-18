import type { AIToolCapability, AIToolDefinitionId } from '../tools';

export type AIMcpServerId = string;

export type AIMcpToolName = string;

export type AIMcpCredentialReferenceId = string;

export type AIMcpTransportKind =
  | 'remote-http'
  | 'remote-sse'
  | 'local-stdio-reserve';

export type AIMcpServerStatus = 'enabled' | 'disabled' | 'deprecated';

export type AIMcpToolDiscoveryStatus =
  | 'not-discovered'
  | 'discovered'
  | 'failed';

export type AIMcpPermissionRequirementLevel =
  | 'none'
  | 'user-consent'
  | 'admin-approved'
  | 'forbidden';

export interface AIMcpServerEndpoint {
  readonly transport: AIMcpTransportKind;
  readonly url?: string;
  readonly commandName?: string;
}

export interface AIMcpCredentialReference {
  readonly id: AIMcpCredentialReferenceId;
  readonly label?: string;
  readonly provider?: string;
  // Store only a reference to a secret managed outside packages/ai, never the secret value.
  readonly secretRef: string;
}

export interface AIMcpPermissionRequirement {
  readonly level: AIMcpPermissionRequirementLevel;
  readonly policyId?: string;
  readonly reason?: string;
}

export interface AIMcpServer {
  readonly id: AIMcpServerId;
  readonly name: string;
  readonly status: AIMcpServerStatus;
  readonly endpoint: AIMcpServerEndpoint;
  readonly credential?: AIMcpCredentialReference;
  readonly permission: AIMcpPermissionRequirement;
  readonly description?: string;
}

export interface AIMcpDiscoveredTool {
  readonly serverId: AIMcpServerId;
  readonly name: AIMcpToolName;
  readonly displayName?: string;
  readonly description?: string;
  readonly capabilities: ReadonlyArray<AIToolCapability>;
  readonly mappedToolId?: AIToolDefinitionId;
  readonly permission: AIMcpPermissionRequirement;
}

export interface AIMcpToolDiscoveryReference {
  readonly serverId: AIMcpServerId;
  readonly status: AIMcpToolDiscoveryStatus;
  readonly discoveredTools: ReadonlyArray<AIMcpDiscoveredTool>;
  readonly discoveredAt?: string;
  readonly failureReason?: string;
}

export interface AIMcpServerReference {
  readonly serverId: AIMcpServerId;
}

export interface AIMcpToolReference extends AIMcpServerReference {
  readonly toolName: AIMcpToolName;
  readonly mappedToolId?: AIToolDefinitionId;
}

export interface AIMcpLocalStdioRiskReserve {
  readonly transport: 'local-stdio-reserve';
  // Local stdio can execute local processes, so v0.1 only reserves the risk shape.
  readonly requiresExplicitFutureApproval: true;
  readonly riskNotes?: string;
}
