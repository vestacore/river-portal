import { commit, type CommandEnv, type EventDraft } from '@river/log';
import { giftEventDraft } from '@river/gifts';
import { needEventDraft } from '@river/needs';
import { readFlow } from './readFlow.ts';

/** The carrier handed the consignment over; each recipient is asked to confirm (DP-08 follows). */
export async function recordDelivery(env: CommandEnv, input: { flowId: string }): Promise<void> {
  const flow = await readFlow(env.store, env.ctx.orgId, input.flowId);
  if (!flow) throw new Error(`Unknown flow ${input.flowId}`);
  const drafts: EventDraft[] = [
    { type: 'consignment.Delivered', aggregate: { kind: 'consignment', id: `${flow.id}-c1` }, visibility: 'team', payload: { flowId: flow.id } },
    { type: 'flow.Arrived', aggregate: { kind: 'flow', id: flow.id }, visibility: 'team', payload: { oblastId: flow.oblastId, campaignId: flow.campaignId } },
  ];
  for (const needId of flow.needIds) {
    drafts.push(needEventDraft(needId, 'need.Delivered', { flowId: flow.id }));
    drafts.push({ type: 'deliveryConfirmation.Requested', aggregate: { kind: 'deliveryConfirmation', id: `${flow.id}-${needId}` }, visibility: 'team', payload: { flowId: flow.id, needId } });
  }
  for (const giftId of flow.giftIds) drafts.push(giftEventDraft(giftId, 'gift.Delivered', { flowId: flow.id }));
  await commit(env, drafts);
}
