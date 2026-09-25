import { commit, type CommandEnv, type EventDraft } from '@river/log';
import { needEventDraft } from '@river/needs';
import { costDrafts } from './costDrafts.ts';
import { readFlow } from './readFlow.ts';
import type { DispatchInput } from './types/DispatchInput.ts';

/**
 * DP-05/DP-07: the consignment leaves with a carrier; costs are recorded in the reporting currency.
 * Costs up to the Lead Coordinator's limit (a setting) are approved at once (DP-06); larger ones
 * wait for the Finance Steward.
 */
export async function dispatchFlow(env: CommandEnv, input: DispatchInput): Promise<void> {
  const flow = await readFlow(env.store, env.ctx.orgId, input.flowId);
  if (!flow) throw new Error(`Unknown flow ${input.flowId}`);
  const drafts: EventDraft[] = [
    {
      type: 'consignment.Dispatched',
      aggregate: { kind: 'consignment', id: `${flow.id}-c1` },
      visibility: 'team',
      payload: { flowId: flow.id, carrierKind: input.carrierKind, carrierName: input.carrierName, carrierPersonId: input.carrierPersonId ?? null, fromLabel: input.fromLabel, toOblastId: flow.oblastId },
    },
    ...input.costs.flatMap((cost) => costDrafts(env, flow, cost, true)),
    { type: 'flow.MotionStarted', aggregate: { kind: 'flow', id: flow.id }, visibility: 'team', payload: {} },
    ...flow.needIds.map((needId) => needEventDraft(needId, 'need.DeliveryStarted', { flowId: flow.id })),
  ];
  await commit(env, drafts);
}
