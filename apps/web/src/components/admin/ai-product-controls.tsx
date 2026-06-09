'use client';

import {
  getAIProductControlStateAction,
  updateAIAgentControlAction,
  updateAIEntitlementPolicyAction,
  updateDefaultAIModelAction,
  type AIProductControlState,
} from '@/actions/ai-product-controls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

function parseLimit(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function AIProductControls() {
  const [state, setState] = useState<AIProductControlState | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      const result = await getAIProductControlStateAction();
      if (!result.data?.success) {
        toast.error(result.data?.error ?? 'Failed to load AI controls.');
        return;
      }
      setState(result.data.data);
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  if (!state) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Product Controls</CardTitle>
          <CardDescription>
            Loading model, agent, and plan controls.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const defaultModel = state.models.find((model) => model.isDefault);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Product Controls</CardTitle>
        <CardDescription>
          Configure the default model, agent rollout, and plan-level AI policy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-medium text-sm">Default Model</h3>
              <p className="text-muted-foreground text-xs">
                Current: {defaultModel?.label ?? 'Not configured'}
              </p>
            </div>
            <Select
              value={
                defaultModel
                  ? `${defaultModel.providerId}:${defaultModel.modelId}`
                  : undefined
              }
              onValueChange={(value) => {
                const [providerId, modelId] = value.split(':');
                startTransition(async () => {
                  const result = await updateDefaultAIModelAction({
                    providerId,
                    modelId,
                  });
                  if (!result.data?.success) {
                    toast.error(
                      result.data?.error ?? 'Failed to update default model.'
                    );
                    return;
                  }
                  toast.success('Default model updated.');
                  refresh();
                });
              }}
              disabled={isPending}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Select default model" />
              </SelectTrigger>
              <SelectContent>
                {state.models.map((model) => (
                  <SelectItem
                    key={`${model.providerId}:${model.modelId}`}
                    value={`${model.providerId}:${model.modelId}`}
                  >
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-sm">Agent Visibility and Rollout</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {state.agents.map((agent) => (
              <div key={agent.id} className="rounded-md border p-3 space-y-3">
                <div>
                  <div className="font-medium text-sm">{agent.displayName}</div>
                  <div className="font-mono text-muted-foreground text-xs">
                    {agent.slug}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={agent.visibility}
                    onValueChange={(visibility) => {
                      startTransition(async () => {
                        const result = await updateAIAgentControlAction({
                          agentId: agent.id,
                          visibility: visibility as
                            | 'system'
                            | 'public'
                            | 'private',
                          status: agent.status as
                            | 'enabled'
                            | 'disabled'
                            | 'deprecated',
                        });
                        if (!result.data?.success) {
                          toast.error(
                            result.data?.error ?? 'Failed to update agent.'
                          );
                          return;
                        }
                        refresh();
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">system</SelectItem>
                      <SelectItem value="public">public</SelectItem>
                      <SelectItem value="private">private</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={agent.status}
                    onValueChange={(status) => {
                      startTransition(async () => {
                        const result = await updateAIAgentControlAction({
                          agentId: agent.id,
                          visibility: agent.visibility as
                            | 'system'
                            | 'public'
                            | 'private',
                          status: status as
                            | 'enabled'
                            | 'disabled'
                            | 'deprecated',
                        });
                        if (!result.data?.success) {
                          toast.error(
                            result.data?.error ?? 'Failed to update agent.'
                          );
                          return;
                        }
                        refresh();
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">enabled</SelectItem>
                      <SelectItem value="disabled">disabled</SelectItem>
                      <SelectItem value="deprecated">deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-sm">Plan AI Entitlement Policy</h3>
          <div className="grid gap-3">
            {state.policies.map((policy) => (
              <PlanPolicyControl
                key={policy.planId}
                policy={policy}
                models={state.models}
                isPending={isPending}
                onUpdated={refresh}
              />
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function PlanPolicyControl({
  policy,
  models,
  isPending,
  onUpdated,
}: {
  readonly policy: AIProductControlState['policies'][number];
  readonly models: AIProductControlState['models'];
  readonly isPending: boolean;
  readonly onUpdated: () => void;
}) {
  const [limit, setLimit] = useState(
    policy.maxCreditsPerRequest ? String(policy.maxCreditsPerRequest) : ''
  );
  const [isSaving, startTransition] = useTransition();

  const submitPolicy = (patch: Partial<typeof policy>) => {
    startTransition(async () => {
      const result = await updateAIEntitlementPolicyAction({
        planId: policy.planId,
        status: patch.status ?? policy.status,
        allowedModelIds: [...(patch.allowedModelIds ?? policy.allowedModelIds)],
        knowledgeEnabled: patch.knowledgeEnabled ?? policy.knowledgeEnabled,
        memoryEnabled: patch.memoryEnabled ?? policy.memoryEnabled,
        toolsEnabled: patch.toolsEnabled ?? policy.toolsEnabled,
        maxCreditsPerRequest:
          patch.maxCreditsPerRequest !== undefined
            ? patch.maxCreditsPerRequest
            : parseLimit(limit),
      });

      if (!result.data?.success) {
        toast.error('Failed to update entitlement policy.');
        return;
      }

      toast.success(`Policy updated for ${policy.planId}.`);
      onUpdated();
    });
  };

  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary">{policy.planId}</Badge>
        <Select
          value={policy.status}
          onValueChange={(status) =>
            submitPolicy({ status: status as 'enabled' | 'disabled' })
          }
          disabled={isPending || isSaving}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enabled">enabled</SelectItem>
            <SelectItem value="disabled">disabled</SelectItem>
          </SelectContent>
        </Select>
        {(['knowledgeEnabled', 'memoryEnabled', 'toolsEnabled'] as const).map(
          (key) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={policy[key]}
                onCheckedChange={(checked) =>
                  submitPolicy({ [key]: checked === true })
                }
                disabled={isPending || isSaving}
              />
              {key.replace('Enabled', '')}
            </div>
          )
        )}
        <Input
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
          onBlur={() =>
            submitPolicy({ maxCreditsPerRequest: parseLimit(limit) })
          }
          placeholder="Max credits/request"
          className="w-[170px]"
          disabled={isPending || isSaving}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {models.map((model) => {
          const isAllowed = policy.allowedModelIds.includes(model.modelId);
          return (
            <Button
              key={`${policy.planId}:${model.providerId}:${model.modelId}`}
              type="button"
              size="sm"
              variant={isAllowed ? 'default' : 'outline'}
              disabled={isPending || isSaving}
              onClick={() => {
                const nextModels = isAllowed
                  ? policy.allowedModelIds.filter((id) => id !== model.modelId)
                  : [...policy.allowedModelIds, model.modelId];
                submitPolicy({ allowedModelIds: nextModels });
              }}
            >
              {model.label}
            </Button>
          );
        })}
        {policy.allowedModelIds.length === 0 ? (
          <span className="text-muted-foreground text-xs">
            No explicit model limit. All enabled models are allowed.
          </span>
        ) : null}
      </div>
    </div>
  );
}
