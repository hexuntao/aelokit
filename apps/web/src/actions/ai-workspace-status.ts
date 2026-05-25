'use server';

import { getAIWorkspaceStatus } from '@/ai/workspace-status';
import type { AIWorkspaceStatus } from '@/ai/workspace-status-types';
import type { SessionUser } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';

export type AIWorkspaceStatusResult =
  | {
      readonly success: true;
      readonly data: AIWorkspaceStatus;
    }
  | {
      readonly success: false;
      readonly error: string;
    };

export const getAIWorkspaceStatusAction = userActionClient.action(
  async ({ ctx }): Promise<AIWorkspaceStatusResult> => {
    try {
      const user = (ctx as { user: SessionUser }).user;
      const status = await getAIWorkspaceStatus(user.id);

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load AI workspace status.',
      };
    }
  }
);
