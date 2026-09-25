import { newId } from '@river/kernel';
import { commit, type CommandEnv, type EventDraft } from '@river/log';
import { needEventDraft } from '@river/needs';
import { approvalLimitGbpMinor } from './approvalLimitGbpMinor.ts';
import { fxRatesToGbp } from './data/fxRatesToGbp.ts';
import { readFlow } from './readFlow.ts';
import type { CostSubmittedPayload } from './types/CostSubmittedPayload.ts';
import type { DispatchInput } from './types/DispatchInput.ts';

/**
 * DP-05/DP-07: the consignment leaves with a carrier; costs are recorded. Costs up to the
 * Lead Coordinator's limit are approved at once (DP-06); larger ones wait for the Finance Steward.
 */
export async function dispatchFlow(env: CommandEnv, input: DispatchInput): Promise<void> {
  const flow = await readFlow(env.store, env.ctx.orgId, input.flowId);
  if (!flow) throw new Error(`Unknown flow ${input.flowId}`);
  const at = env.ctx.at ? new Date(env.ctx.at) : new Date();
  const drafts: EventDraft[] = [
    {
      type: 'consignment.Dispatched',
      aggregate: { kind: 'consignment', id: `${flow.id}-c1` },
      visibility: 'team',
      payload: { flowId: flow.id, carrierKind: input.carrierKind, carrierName: input.carrierName, fromLabel: input.fromLabel, toOblastId: flow.oblastId },
    },
  ];
  for (const cost of input.costs) {
    const costId = newId('cost', at);
    const fxRateToGbp = fxRatesToGbp[cost.currency] ?? 1;
    const payload: CostSubmittedPayload = {
      flowId: flow.id, campaignId: flow.campaignId, kind: cost.kind, amountMinor: cost.amountMinor,
      currency: cost.currency, fxRateToGbp, gbpMinor: Math.round(cost.amountMinor * fxRateToGbp), note: cost.note,
    };
    const aggregate = { kind: 'costRecord', id: costId };
    drafts.push({ type: 'costRecord.Submitted', aggregate, visibility: 'team', payload });
    if (payload.gbpMinor <= approvalLimitGbpMinor()) {
      drafts.push({ type: 'costRecord.Approved', aggregate, visibility: 'public', payload: { ...payload, approvedAs: 'lead' } });
    }
  }
  drafts.push({ type: 'flow.MotionStarted', aggregate: { kind: 'flow', id: flow.id }, visibility: 'team', payload: {} });
  for (const needId of flow.needIds) drafts.push(needEventDraft(needId, 'need.DeliveryStarted', { flowId: flow.id }));
  await commit(env, drafts);
}
