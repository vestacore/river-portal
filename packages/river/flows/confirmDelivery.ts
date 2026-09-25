import { newId } from '@river/kernel';
import { commit, type CommandEnv, type EventDraft } from '@river/log';
import { needEventDraft, readNeed } from '@river/needs';
import { redactPii } from '@river/privacy';
import { flowPaths } from './paths.ts';
import { readFlow } from './readFlow.ts';
import type { ConfirmationInput } from './types/ConfirmationInput.ts';
import type { GratitudeNote } from './types/GratitudeNote.ts';
import type { GratitudeWrittenPayload } from './types/GratitudeWrittenPayload.ts';

/**
 * The recipient confirms receipt and may write thanks. Each use of the thanks is a separate,
 * revocable consent (spec P5). When every need of the flow is confirmed, the flow is confirmed.
 */
export async function confirmDelivery(env: CommandEnv, input: ConfirmationInput): Promise<void> {
  const need = await readNeed(env.store, env.ctx.orgId, input.needId);
  if (!need?.record.flowId) throw new Error('Need has no flow');
  if (need.record.status === 'confirmed' || need.record.status === 'closed') return;
  const flow = await readFlow(env.store, env.ctx.orgId, need.record.flowId);
  if (!flow) throw new Error('Unknown flow');
  const at = env.ctx.at ? new Date(env.ctx.at) : new Date();
  const drafts: EventDraft[] = [
    {
      type: 'deliveryConfirmation.Recorded',
      aggregate: { kind: 'deliveryConfirmation', id: `${flow.id}-${input.needId}` },
      visibility: 'team',
      payload: { flowId: flow.id, needId: input.needId, by: input.by, hasNote: input.note.length > 0 },
    },
    needEventDraft(input.needId, 'need.Confirmed', { flowId: flow.id }),
  ];

  let note: GratitudeNote | null = null;
  if (input.thanks) {
    const names = need.details ? [need.details.name, need.details.settlement] : [];
    note = {
      id: newId('thanks', at), needId: input.needId, flowId: flow.id, locale: input.locale, text: input.thanks,
      shareWithParticipants: input.shareWithParticipants, showOnWall: input.showOnWall, writtenAt: at.toISOString(),
    };
    const payload: GratitudeWrittenPayload = {
      flowId: flow.id, needId: input.needId, locale: input.locale, onWall: input.showOnWall,
      sharedWithParticipants: input.shareWithParticipants,
      publicText: input.showOnWall ? redactPii(input.thanks, names) : null,
      oblastId: flow.oblastId,
    };
    drafts.push({ type: 'gratitudeNote.Written', aggregate: { kind: 'gratitudeNote', id: note.id }, visibility: input.showOnWall ? 'public' : input.shareWithParticipants ? 'participants' : 'team', payload });
    for (const [purpose, given] of [['gratitude.participants', input.shareWithParticipants], ['gratitude.wall', input.showOnWall]] as const) {
      if (given) drafts.push({ type: 'consent.Granted', aggregate: { kind: 'consent', id: `${note.id}-${purpose}` }, visibility: 'team', payload: { purpose, subject: { kind: 'gratitudeNote', id: note.id } } });
    }
  }

  const othersConfirmed = await Promise.all(
    flow.needIds.filter((id) => id !== input.needId).map(async (id) => (await readNeed(env.store, env.ctx.orgId, id))?.record.status === 'confirmed'),
  );
  if (othersConfirmed.every(Boolean)) drafts.push({ type: 'flow.Confirmed', aggregate: { kind: 'flow', id: flow.id }, visibility: 'team', payload: {} });

  await commit(env, drafts, (tx) => {
    if (note) tx.set(flowPaths.gratitude(env.ctx.orgId, note.id), note);
  });
}
