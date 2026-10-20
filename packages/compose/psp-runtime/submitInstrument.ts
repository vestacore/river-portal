import type { InstrumentDetail, InstrumentId } from '@river/psp-facts';
import { needsChallenge, screenAttempt } from '@river/psp-flow';
import { findInstrument } from '@river/psp-instruments';
import type { AlertKind } from '@river/psp-risk';
import { isSessionClosed } from '@river/psp-session';
import { policyValue } from '@river/psp-units';
import { appendFacts } from './appendFacts.ts';
import { driveSession } from './driveSession.ts';
import { effectiveFor } from './effectiveFor.ts';
import { openAlert } from './openAlert.ts';
import { riskSignalsFor } from './riskSignalsFor.ts';
import { routeSession } from './routeSession.ts';
import type { Scenario, Waiting, World } from './types/World.ts';

const kindOf = (reasons: readonly string[]): AlertKind =>
  reasons.includes('blocked_country') ? 'geography' : reasons.includes('structuring') ? 'structuring' : reasons.includes('velocity') ? 'velocity'
    : reasons.includes('country_mismatch') ? 'geography' : reasons.includes('threshold') ? 'threshold' : 'rule';

/**
 * The payer chooses how to pay, and the river does the rest it can: the choice (door), the screening
 * (figure: the score, then every rule of the unit and above), and — unless the attempt is blocked or held
 * for an officer — the route (figure) and as much of the instrument's course as needs nobody else.
 */
export function submitInstrument(world: World, sessionId: string, instrument: InstrumentId, detail: InstrumentDetail, scenario: Omit<Scenario, 'challenge'> & { issuerWantsChallenge?: boolean }, at: string): Waiting | { error: string } {
  const session = world.views.sessions.get(sessionId);
  if (!session || isSessionClosed(session)) return { error: 'closed' };
  if (session.instrument) return driveSession(world, sessionId, at);
  const effective = effectiveFor(world, session.unitId);
  const allowed = (policyValue(effective, 'instruments.allowed') as string[] | null) ?? [];
  if (!allowed.includes(instrument)) return { error: 'instrument_not_allowed' };
  const definition = findInstrument(instrument);
  const payer = { via: 'door' as const, actor: 'payer', role: 'payer' };
  appendFacts(world, sessionId, [{ type: 'instrument.Chosen', payload: { sessionId, instrument, detail } }], payer, at);
  const signals = riskSignalsFor(world, session, instrument, detail, at);
  const screening = screenAttempt({ units: world.units, rules: world.rules, unitId: session.unitId, signals, effective });
  const figure = { via: 'figure' as const, by: 'risk' };
  appendFacts(world, sessionId, [{ type: 'risk.Scored', payload: { sessionId, score: screening.score, level: screening.level, reasons: screening.reasons, decision: screening.decision } }], figure, at);
  const order = world.views.orders.get(session.orderId);
  if (order) {
    const list = world.caches.payer.get(order.payerRef) ?? [];
    list.push({ at: Date.parse(at), amountMinor: session.amountMinor, failed: false });
    world.caches.payer.set(order.payerRef, list.slice(-30));
  }
  const alertInput = { unitId: session.unitId, sessionId, paymentId: null, amountMinor: session.amountMinor, currency: session.currency, score: screening.score, reasons: screening.reasons, at };
  if (screening.decision === 'block') {
    openAlert(world, { ...alertInput, kind: kindOf(screening.reasons) });
    appendFacts(world, sessionId, [{ type: 'session.Failed', payload: { sessionId, invoiceId: session.invoiceId, code: 'blocked', reason: 'Refused at screening' } }], figure, at);
    return 'failed';
  }
  if (screening.reasons.includes('threshold') || screening.notify) openAlert(world, { ...alertInput, kind: screening.reasons.includes('threshold') ? 'threshold' : 'rule' });
  const challenge = needsChallenge({ instrument, amountMinor: session.amountMinor, score: screening.score, level: screening.level, issuerWants: scenario.issuerWantsChallenge ?? false, effective });
  world.scenarios.set(sessionId, { ...scenario, challenge: challenge.challenge, routeTo: screening.routeTo });
  if (screening.decision === 'review') {
    const alertId = openAlert(world, { ...alertInput, kind: kindOf(screening.reasons) });
    appendFacts(world, sessionId, [{ type: 'review.Opened', payload: { sessionId, alertId, reason: screening.reasons.join(', ') || 'rule' } }], figure, at);
    return 'review';
  }
  routeSession(world, sessionId, definition.rail, screening.routeTo, at);
  return driveSession(world, sessionId, at);
}
