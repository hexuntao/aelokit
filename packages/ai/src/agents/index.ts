import type { AIModelReference } from '../models';
import type { AISkillDefinitionId } from '../skills';
import type { AIToolDefinitionId } from '../tools';

export type AIAgentId = string;

export type AIAgentEnabledStatus = 'enabled' | 'disabled' | 'deprecated';

export type AIAgentVisibility = 'system' | 'workspace' | 'user' | 'private';

export interface AIAgentDisplayMetadata {
  readonly name: string;
  readonly description?: string;
}

export interface AIAgentInstructionContract {
  readonly systemPrompt: string;
  readonly developerInstructions?: string;
  readonly responseStyle?: string;
  readonly version?: string;
}

export interface AIAgentToolReference {
  readonly toolId: AIToolDefinitionId;
  readonly required?: boolean;
}

export interface AIAgentSkillReference {
  readonly skillId: AISkillDefinitionId;
  readonly required?: boolean;
}

export interface AIAgentCapabilityReferences {
  readonly tools: ReadonlyArray<AIAgentToolReference>;
  readonly skills: ReadonlyArray<AIAgentSkillReference>;
}

export interface AIAgent {
  readonly id: AIAgentId;
  readonly slug: string;
  readonly display: AIAgentDisplayMetadata;
  readonly visibility: AIAgentVisibility;
  readonly status: AIAgentEnabledStatus;
  readonly instructions: AIAgentInstructionContract;
  // Reserved for future runtime selection; packages/ai does not resolve models.
  readonly defaultModel?: AIModelReference;
  readonly capabilities: AIAgentCapabilityReferences;
}

export interface AIAgentReference {
  readonly agentId: AIAgentId;
}

export interface AIAgentSelectionReference extends AIAgentReference {
  readonly model?: AIModelReference;
}
