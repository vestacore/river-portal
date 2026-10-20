import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contractStatusAt } from '@river/psp-contracts';
import { invoiceStatusAt } from '@river/psp-invoice';
import { advanceContract } from './advanceContract.ts';
import { createWorld } from './createWorld.ts';
import { decideRequest } from './decideRequest.ts';
import { decideReview } from './decideReview.ts';
import { personaActor } from './personaActor.ts';
import { placeOrder } from './placeOrder.ts';
import { startSession } from './startSession.ts';
import { submitInstrument } from './submitInstrument.ts';

const at = '2026-10-19T10:00:00.000Z';
const door = { via: 'door' as const, actor: 'test', role: 'merchant' };
const course = { sku: 'KR-UX', title: { 'en-GB': 'UX design intensive', uk: 'Інтенсив з UX-дизайну' }, quantity: 1, unitMinor: 1_150_000, totalMinor: 1_150_000, sellerUnitId: null };

/** A Krok invoice paid by a transfer that arrives short by `shortMinor`. */
function transferShortBy(shortMinor: number) {
  const world = createWorld(at);
  const placed = placeOrder(world, { unitId: 'ou-krok', channel: 'invoice', lines: [course], payerRef: 'py_short' }, door, at);
  if ('error' in placed) throw new Error(placed.error);
  const opened = startSession(world, placed.invoiceId, { channel: 'invoice', locale: 'uk', country: 'UA', payerHandle: 'py_short' }, at);
  if ('error' in opened) throw new Error(opened.error);
  const waiting = submitInstrument(world, opened.sessionId, 'bank_transfer', {}, { issuer: 'approve', pushed: true, mismatchMinor: -shortMinor }, at);
  const actor = (personId: string) => personaActor(world, personId, null, at)!;
  return { world, waiting, sessionId: opened.sessionId, invoiceId: placed.invoiceId, orderId: placed.orderId, actor };
}

test('money that does not match waits for a person, with an alert; an operator may take it and the rest stays due', () => {
  const { world, waiting, sessionId, invoiceId, orderId, actor } = transferShortBy(50_000);
  assert.equal(waiting, 'review');
  const held = world.views.sessions.get(sessionId)!;
  assert.equal(held.outcome, 'review');
  assert.deepEqual(held.mismatch, { expectedMinor: 1_150_000, gotMinor: 1_100_000 });
  const alert = world.alerts.find((a) => a.id === held.review?.alertId);
  assert.equal(alert?.kind, 'mismatch');
  assert.equal(decideReview(world, actor('p-halyna'), sessionId, true, '', at).ok, false, 'a merchant owner elsewhere may not decide');
  assert.equal(decideReview(world, actor('p-iryna'), sessionId, true, 'The payer confirmed a partial transfer', at).ok, true, 'the operator of the entity may');
  const session = world.views.sessions.get(sessionId)!;
  assert.equal(session.outcome, 'succeeded');
  assert.equal(session.capturedMinor, 1_100_000, 'what arrived is captured, not what was asked');
  const payment = world.views.payments.get(session.paymentId!)!;
  assert.equal(payment.allocations.reduce((s, a) => s + a.amountMinor, 0), 1_100_000, 'the split sums to the capture');
  assert.equal(invoiceStatusAt(world.views.invoices.get(invoiceId)!, at), 'partially_paid');
  assert.equal(world.views.orders.get(orderId)!.status, 'partially_paid');
  assert.equal(alert?.status, 'closed');
  assert.ok(world.audit.some((e) => e.action === 'mismatch.take' && e.target === sessionId && e.role === 'operator'));
});

test('money that does not match may be returned: the attempt ends and nothing is captured', () => {
  const { world, sessionId, invoiceId, actor } = transferShortBy(50_000);
  assert.equal(decideReview(world, actor('p-marta'), sessionId, false, '', at).ok, true);
  const session = world.views.sessions.get(sessionId)!;
  assert.equal(session.outcome, 'failed');
  assert.equal(session.paymentId, null);
  assert.equal(world.views.invoices.get(invoiceId)!.paidMinor, 0);
  assert.equal(decideReview(world, actor('p-marta'), sessionId, true, '', at).ok, false, 'decided once');
});

test('a merchant takes payments only under an active contract', () => {
  const world = createWorld(at);
  const order = (unitId: string) => placeOrder(world, { unitId, channel: 'web', lines: [{ ...course, unitMinor: 10_000, totalMinor: 10_000 }], payerRef: 'py_c' }, door, at);
  assert.ok(!('error' in order('ou-krok')));
  world.contracts.find((c) => c.id === 'ct-krk')!.status = 'suspended';
  assert.deepEqual(order('ou-krok'), { error: 'the merchant has no active contract' });
  world.units.find((u) => u.id === 'ou-lis')!.status = 'active';
  assert.deepEqual(order('ou-lis'), { error: 'the merchant has no active contract' }, 'approved at onboarding, its contract still a draft');
});

test('a contract steps from its status today: an expired one is renewed, not suspended', () => {
  const world = createWorld(at);
  const later = '2026-11-20T10:00:00.000Z';
  const andrii = personaActor(world, 'p-andrii', null, later)!;
  const amber = world.contracts.find((c) => c.id === 'ct-amb')!;
  assert.equal(contractStatusAt(amber, later), 'expired');
  assert.deepEqual(advanceContract(world, andrii, 'ct-amb', 'suspended', later), { ok: false, error: 'expired → suspended is not a step' });
  assert.equal(advanceContract(world, andrii, 'ct-amb', 'active', later).ok, true);
  assert.equal(contractStatusAt(amber, later), 'active');
  assert.ok(amber.validTo! > later, 'renewed for another year');
});

test('an access request is decided by someone else, never across a separation of duties, and recorded either way', () => {
  const world = createWorld(at);
  const andrii = personaActor(world, 'p-andrii', null, at)!;
  const taras = decideRequest(world, andrii, 'rq-taras-aml', true, at);
  assert.equal(taras.ok, false);
  assert.match(taras.ok ? '' : taras.error, /^separation of duties/);
  assert.equal(world.requests.find((r) => r.id === 'rq-taras-aml')?.status, 'pending');
  assert.equal(decideRequest(world, andrii, 'rq-jonas-eu', false, at).ok, true);
  const line = world.audit.find((e) => e.action === 'request.reject' && e.target === 'rq-jonas-eu');
  assert.ok(line, 'a declined request is a line of the audit trail');
  assert.match(line.detail.uk, /Інтегратор/);
  assert.equal(decideRequest(world, andrii, 'rq-jonas-eu', true, at).ok, false, 'decided once');
});
