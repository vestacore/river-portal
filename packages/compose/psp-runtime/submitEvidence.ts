import { appendFacts } from './appendFacts.ts';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** An operator sends evidence for an open dispute to the card scheme. */
export function submitEvidence(world: World, actor: Actor, paymentId: string, disputeId: string, documents: number, at: string): CommandResult {
  const payment = world.views.payments.get(paymentId);
  const dispute = payment?.disputes.find((d) => d.disputeId === disputeId);
  if (!payment || !dispute || dispute.status !== 'open') return { ok: false, error: 'nothing_to_answer' };
  const denied = guard(world, actor, 'disputes.respond', payment.unitId, at);
  if (denied) return { ok: false, error: denied };
  const by = actor.kind === 'person' ? actor.personId : 'operator';
  appendFacts(world, paymentId, [{ type: 'dispute.Evidenced', payload: { paymentId, disputeId, documents, by } }], { via: 'door', actor: by, role: 'operator' }, at);
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: payment.unitId, action: 'dispute.evidence', target: disputeId, detail: { 'en-GB': `Submitted ${documents} documents`, uk: `Подав документів: ${documents}` }, at });
  return { ok: true, value: { disputeId } };
}
