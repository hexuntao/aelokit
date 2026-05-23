'use server';

import { saveUserDefaultModelSelection } from '@/ai/models';
import type { ChatModelOption } from '@/components/ai/types';
import type { SessionUser } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { z } from 'zod';

type ChatModelActionResult<T> =
  | {
      readonly success: true;
      readonly data: T;
    }
  | {
      readonly success: false;
      readonly error: {
        readonly message: string;
      };
    };

const saveUserDefaultModelSchema = z.object({
  modelId: z.string().min(1),
});

export const saveUserDefaultModelAction = userActionClient
  .inputSchema(saveUserDefaultModelSchema)
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<
      ChatModelActionResult<{
        readonly userDefaultModelId: string;
        readonly selectedModel: ChatModelOption;
      }>
    > => {
      const user = (ctx as { user: SessionUser }).user;
      const result = await saveUserDefaultModelSelection(
        user.id,
        parsedInput.modelId
      );

      if (!result.success) {
        return {
          success: false,
          error: {
            message: result.error.message,
          },
        };
      }

      return {
        success: true,
        data: result.data,
      };
    }
  );
