import { newId } from '@river/kernel';
import { commit, type CommandEnv } from '@river/log';
import { giftEventDraft } from '@river/gifts';
import { needEventDraft, readNeed } from '@river/needs';

/**
 * DP-04: a coordinator links gifts to a need, forming a committed flow.
 * Returns the new flow id.
 */
export async function matchNeed(
  env: CommandEnv,
  input: { needId: string; giftIds: string[]; campaignId: string | null },
): Promise<string> {
  const need = await readNeed(env.store, env.ctx.orgId, input.needId);
  if (!need) throw new Error(`Unknown need ${input.needId}`);
  const flowId = newId('flow', env.ctx.at ? new Date(env.ctx.at) : new Date());
  const aggregate = { kind: 'flow', id: flowId };
  await commit(env, [
    {
      type: 'flow.Formed',
      aggregate,
      visibility: 'team',
      payload: { needIds: [input.needId], giftIds: input.giftIds, campaignId: input.campaignId, oblastId: need.record.oblastId, lead: env.ctx.actor.label ?? 'coordinator' },
    },
    { type: 'flow.Committed', aggregate, visibility: 'team', payload: {} },
    ...input.giftIds.map((giftId) => giftEventDraft(giftId, 'gift.Allocated', { flowId })),
    needEventDraft(input.needId, 'need.Matched', { flowId }),
  ]);
  return flowId;
}
