import type { AIToolDefinitionId } from '../tools';

export type AISkillDefinitionId = string;

export type AISkillVisibility = 'system' | 'workspace' | 'user' | 'private';

export type AISkillCapability =
  | 'instruction'
  | 'prompting'
  | 'workflow'
  | 'tool-group'
  | 'knowledge-guidance';

export interface AISkillDisplayMetadata {
  readonly name: string;
  readonly description?: string;
}

export interface AISkillInstructionContract {
  readonly instructions: string;
  readonly version?: string;
}

export interface AISkillToolReference {
  readonly toolId: AIToolDefinitionId;
  readonly optional?: boolean;
}

export interface AISkillCapabilityReferences {
  readonly tools: ReadonlyArray<AISkillToolReference>;
  readonly capabilities: ReadonlyArray<AISkillCapability>;
}

export interface AISkillDefinition {
  readonly id: AISkillDefinitionId;
  readonly slug: string;
  readonly display: AISkillDisplayMetadata;
  readonly visibility: AISkillVisibility;
  // A skill groups reusable instructions/capabilities; tools remain executable actions.
  readonly instructions: AISkillInstructionContract;
  readonly references: AISkillCapabilityReferences;
}

export interface AISkillReference {
  readonly skillId: AISkillDefinitionId;
}
