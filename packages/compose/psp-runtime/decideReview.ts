import { findInstrument } from '@river/psp-instruments';
import { appendFacts } from './appendFacts.ts';
import { driveSession } from './driveSession.ts';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import { routeSession } from './routeSession.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/**
 * A person decides an attempt the river holds. Held at screening, it is a compliance officer's: cleared,
 * it is routed and goes on down the river; rejected, it ends there. Held because the money that arrived
 * does not match, an operator may decide as well: taken, what arrived is received — never more than was
 * due, so a shortfall leaves the invoice partly due — and captured; returned, the attempt ends and the
 * money goes back to the payer. The alert behind the hold follows the decision.
 */
export function decideReview(world: World, actor: Actor, sessionId: string, clear: boolean, note: string, at: string): CommandResult {
  const session = world.views.sessions.get(sessionId);
  if (!session || session.outcome !== 'review' || !session.review || session.review.status !== 'open') return { ok: false, error: 'nothing_to_decide' };
  const mismatch = session.failure?.code.startsWith('mismatch_') ?? false;
  const denied = guard(world, actor, 'aml.review', session.unitId, at);
  if (denied && !(mismatch && guard(world, actor, 'payments.capture', session.unitId, at) === null)) return { ok: false, error: denied };
  const by = actor.kind === 'person' ? actor.personId : 'officer';
  const door = { via: 'door' as const, actor: by, role: actor.kind === 'person' ? actor.role : 'officer' };
  const alertId = session.review.alertId;
  const reason = note || (mismatch ? 'The amount did not match; returned to the payer' : 'Rejected at review');
  if (clear) {
    appendFacts(world, sessionId, [{ type: 'review.Cleared', payload: { sessionId, alertId, by } }], door, at);
    if (!mismatch && session.instrument) routeSession(world, sessionId, findInstrument(session.instrument).rail, world.scenarios.get(sessionId)?.routeTo ?? null, at);
    driveSession(world, sessionId, at);
  } else {
    appendFacts(world, sessionId, [
      { type: 'review.Rejected', payload: { sessionId, alertId, by, reason } },
      { type: 'session.Failed', payload: { sessionId, invoiceId: session.invoiceId, code: mismatch ? 'mismatch_returned' : 'rejected', reason } },
    ], door, at);
  }
  const verdict = mismatch
    ? (clear ? { 'en-GB': 'Took what arrived', uk: 'Прийнято те, що надійшло' } : { 'en-GB': 'Returned to the payer', uk: 'Повернуто платнику' })
    : (clear ? { 'en-GB': 'Cleared', uk: 'Дозволено' } : { 'en-GB': 'Rejected', uk: 'Відхилено' });
  const alert = world.alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.status = 'closed';
    alert.updatedAt = at;
    alert.assignee = by;
    alert.notes.push({ at, by, text: note ? { 'en-GB': `${verdict['en-GB']}: ${note}`, uk: `${verdict.uk}: ${note}` } : verdict });
  }
  if (actor.kind === 'person') {
    const action = mismatch ? (clear ? 'mismatch.take' : 'mismatch.return') : (clear ? 'review.clear' : 'review.reject');
    const detail = mismatch
      ? (clear ? { 'en-GB': 'Took money that did not match the invoice', uk: 'Прийняв кошти, що не збіглися з інвойсом' } : { 'en-GB': 'Returned money that did not match the invoice', uk: 'Повернув кошти, що не збіглися з інвойсом' })
      : (clear ? { 'en-GB': 'Cleared a held attempt', uk: 'Дозволив затриману спробу' } : { 'en-GB': 'Rejected a held attempt', uk: 'Відхилив затриману спробу' });
    recordAudit(world, { personId: actor.personId, role: actor.role, unitId: session.unitId, action, target: sessionId, detail, at });
  }
  return { ok: true, value: { sessionId } };
}
