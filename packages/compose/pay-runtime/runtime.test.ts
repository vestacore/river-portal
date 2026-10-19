import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { figurePaths, readOutbox, type OutboxEntry } from '@river/figure';
import { payFacts } from '@river/pay-facts';
import type { FetchLike } from '@river/pay-providers';
import { ledgerSummary, readAllOrders, readOrder } from '@river/pay-views';
import { createMemoryStore } from '@river/store';
import { readStream } from '@river/stream';
import {
  cancelOrderAs, carryPending, checkOrder, closeAbandoned, createPayRuntime, expireDue, handleDischarge, handleIngest, handlePaypalWebhook, handleStripeWebhook, handleTick,
  parseDoorAct, placeOrderAs, readPayConfig, readRiver, requestCheckoutFor, seedPayDemo, simulateOutcome,
  type FunctionCall, type FunctionRequest, type PayRuntime,
} from './gate.ts';

const local = { RIVER_STORE: 'memory', PAY_SEED: 'none' };
const river = (env: Record<string, string> = {}) => createPayRuntime(readPayConfig({ ...local, ...env }), { store: createMemoryStore() });
const t0 = new Date('2026-10-01T10:00:00.000Z');
const later = (minutes: number) => new Date(t0.getTime() + minutes * 60_000);
const loaves = { title: 'Ten loaves', amount: '120', currency: 'EUR', payerRef: 'anna.k' };
const types = async (runtime: PayRuntime, orderId: string) => (await readStream(runtime.store, runtime.root, orderId)).map((f) => f.type);

async function placed(runtime: PayRuntime, merchantId = 'm-bakery', input: Record<string, string> = loaves, at = t0) {
  const result = await placeOrderAs(runtime, merchantId, input, at);
  assert.ok(result.ok, 'the order is placed');
  return result.value;
}

test('the whole line in one process: order → invoice → gate → route → session → capture → entry → receipt', async () => {
  const runtime = await river();
  const { orderId, payKey } = await placed(runtime);
  const invoiced = await readOrder(runtime.store, runtime.root, orderId);
  assert.deepEqual([invoiced?.status, invoiced?.invoice?.feeMinor, invoiced?.invoice?.netMinor, invoiced?.invoice?.expiresAt], ['invoiced', 300, 11_700, '2026-10-04T10:00:00.000Z']);
  assert.equal(JSON.stringify(await readStream(runtime.store, runtime.root, orderId)).includes(payKey), false, 'the pay key is nowhere in the stream');

  assert.deepEqual(await requestCheckoutFor(runtime, { payKey: 'x'.repeat(43) }, later(1)), { ok: false, errors: [{ field: 'order', code: 'notFound' }] }, 'no key, no gate');
  assert.deepEqual(await requestCheckoutFor(runtime, { orderId, payerRef: 'corner-cafe' }, later(1)), { ok: false, errors: [{ field: 'order', code: 'notFound' }] }, 'another payer does not see it');

  const sessionRef = `sim_stripe_${orderId}-4`;
  assert.deepEqual(await requestCheckoutFor(runtime, { payKey }, later(1)), { ok: true, value: { orderId, status: 'open', redirectUrl: `http://localhost:3000/pay/sim/${sessionRef}`, standIn: true } });
  assert.deepEqual((await requestCheckoutFor(runtime, { payKey }, later(2))).ok && (await types(runtime, orderId)).length, 6, 'asking again beside an open session writes nothing');

  assert.deepEqual(await simulateOutcome(runtime, sessionRef, 'paid', { payKey: 'x'.repeat(43) }, later(3)), { ok: false, errors: [{ field: 'session', code: 'notFound' }] }, 'a session reference alone opens nothing');
  assert.deepEqual(await simulateOutcome(runtime, sessionRef, 'paid', { payerRef: 'corner-cafe' }, later(3)), { ok: false, errors: [{ field: 'session', code: 'notFound' }] }, 'nor does being another payer');
  assert.deepEqual(await simulateOutcome(runtime, sessionRef, 'paid', { payKey }, later(3)), { ok: true, value: { orderId, status: 'paid' } });
  const view = await readOrder(runtime.store, runtime.root, orderId);
  assert.deepEqual([view?.status, view?.receiptId, view?.paid?.provider, view?.paid?.simulated, view?.route?.reason], ['paid', `rcpt-${orderId}`, 'stripe', true, 'Stripe carries every currency of the river']);
  assert.deepEqual((await readRiver(runtime, orderId)).map((r) => [r.type, r.kind]), [
    [payFacts.orderPlaced, 'gesture'], [payFacts.invoiceIssued, 'figure'], [payFacts.checkoutRequested, 'gesture'], [payFacts.providerRouted, 'figure'],
    [payFacts.providerSessionRequested, 'intention'], [payFacts.providerSessionOpened, 'answer'], [payFacts.paymentCaptured, 'report'],
    [payFacts.ledgerPosted, 'figure'], [payFacts.orderPaid, 'figure'], [payFacts.receiptIssued, 'figure'],
  ]);
  assert.deepEqual(await checkOrder(runtime, orderId), { facts: 10, view: true, state: true, outbox: true }, 'what is kept beside the stream equals a fold of it');
  const ledger = ledgerSummary(await readAllOrders(runtime.store, runtime.root));
  assert.deepEqual([ledger.balanced, ledger.totals], [true, [{ currency: 'EUR', orders: 1, capturedMinor: 12_000, feesMinor: 300, payableMinor: 11_700 }]]);

  await simulateOutcome(runtime, sessionRef, 'paid', { payKey }, later(4));
  await requestCheckoutFor(runtime, { payKey }, later(5));
  assert.equal((await types(runtime, orderId)).length, 10, 'a second report of the same outcome, and a word at a paid order, write nothing');
});

test('a provider that waits to be asked: the approval raises the capture, and the same process carries it', async () => {
  const runtime = await river();
  const { orderId, payKey } = await placed(runtime, 'm-bakery', { title: 'Birthday cake', amount: '35', currency: 'USD', payerRef: 'anna.k' });
  const asked = await requestCheckoutFor(runtime, { payKey }, later(1));
  assert.ok(asked.ok && asked.value.redirectUrl?.includes('sim_paypal_'), 'a small USD payment goes to PayPal');
  await simulateOutcome(runtime, `sim_paypal_${orderId}-4`, 'paid', { payerRef: 'anna.k' }, later(2));
  const rows = await readRiver(runtime, orderId);
  assert.deepEqual(rows.slice(6).map((r) => [r.type, r.kind, r.answering]), [
    [payFacts.providerSessionApproved, 'report', null], [payFacts.providerCaptureRequested, 'intention', null], [payFacts.paymentCaptured, 'answer', 7],
    [payFacts.ledgerPosted, 'figure', null], [payFacts.orderPaid, 'figure', null], [payFacts.receiptIssued, 'figure', null],
  ]);
  assert.equal((await readOrder(runtime.store, runtime.root, orderId))?.status, 'paid');
  assert.deepEqual(await checkOrder(runtime, orderId), { facts: 12, view: true, state: true, outbox: true });
});

test('a declined payment: the payer asks again and another bank carries it; nothing connected, nothing carried', async () => {
  const runtime = await river();
  const { orderId, payKey } = await placed(runtime);
  await requestCheckoutFor(runtime, { payKey }, later(1));
  assert.deepEqual(await simulateOutcome(runtime, `sim_stripe_${orderId}-4`, 'declined', { payKey }, later(2)), { ok: true, value: { orderId, status: 'retry' } });
  const declined = await readOrder(runtime.store, runtime.root, orderId);
  assert.deepEqual([declined?.lastFailure?.provider, declined?.lastFailure?.reason, declined?.session], ['stripe', 'declined on the simulated page', null]);
  assert.deepEqual(await simulateOutcome(runtime, `sim_stripe_${orderId}-4`, 'paid', { payKey }, later(3)), { ok: false, errors: [{ field: 'session', code: 'notFound' }] }, 'a closed session takes no outcome');

  const again = await requestCheckoutFor(runtime, { payKey }, later(4));
  assert.ok(again.ok && again.value.status === 'open' && again.value.redirectUrl?.includes('sim_paypal_'));
  assert.equal((await readOrder(runtime.store, runtime.root, orderId))?.route?.reason, 'PayPal carries EUR, USD and GBP (after Stripe failed)');
  await simulateOutcome(runtime, `sim_paypal_${orderId}-9`, 'paid', { payKey }, later(5));
  assert.equal((await readOrder(runtime.store, runtime.root, orderId))?.status, 'paid');

  const bowls = await placed(runtime, 'm-ceramics', { title: 'Two serving bowls', amount: '1800', currency: 'UAH', payerRef: 'corner-cafe' });
  assert.deepEqual(await requestCheckoutFor(runtime, { payKey: bowls.payKey }, later(1)), { ok: true, value: { orderId: bowls.orderId, status: 'refused', redirectUrl: null, standIn: false } });
  await requestCheckoutFor(runtime, { payKey: bowls.payKey }, later(2));
  assert.deepEqual(await types(runtime, bowls.orderId), [payFacts.orderPlaced, payFacts.invoiceIssued, payFacts.checkoutRequested, payFacts.checkoutRefused], 'a refused order is not asked again');
});

test('time enters as a fact: the clock cancels an invoice past its date, and never one whose payer is at the bank', async () => {
  const runtime = await river();
  const waiting = await placed(runtime);
  const atBank = await placed(runtime, 'm-bakery', { ...loaves, title: 'At the bank' });
  const atDoor = await placed(runtime, 'm-bakery', { ...loaves, title: 'At the door' });
  await requestCheckoutFor(runtime, { payKey: atBank.payKey }, later(1));

  assert.equal(await expireDue(runtime, later(71 * 60)), 0, 'not yet');
  assert.deepEqual(await requestCheckoutFor(runtime, { payKey: atDoor.payKey }, later(73 * 60)), { ok: false, errors: [{ field: 'order', code: 'expired' }] });
  assert.equal((await readOrder(runtime.store, runtime.root, atDoor.orderId))?.status, 'cancelled', 'the door lets time in before it refuses');
  assert.equal(await expireDue(runtime, later(73 * 60)), 1);
  const expired = await readOrder(runtime.store, runtime.root, waiting.orderId);
  assert.deepEqual([expired?.status, expired?.cancelled?.by, expired?.cancelled?.reason], ['cancelled', 'clock', 'the invoice expired']);
  assert.equal((await readOrder(runtime.store, runtime.root, atBank.orderId))?.status, 'open', 'an attempt under way is left to end by itself');
  assert.equal(await expireDue(runtime, later(74 * 60)), 0, 'the clock says it once');
  assert.deepEqual((await readRiver(runtime, waiting.orderId)).slice(-2).map((r) => [r.type, r.kind, r.who]), [[payFacts.cancellationRequested, 'report', 'clock'], [payFacts.orderCancelled, 'figure', 'decideCancellation']], 'the clock asks; the figure decides');

  await simulateOutcome(runtime, `sim_stripe_${atBank.orderId}-4`, 'paid', { payKey: atBank.payKey }, later(75 * 60));
  assert.equal((await readOrder(runtime.store, runtime.root, atBank.orderId))?.status, 'paid', 'and if that payment arrives, it is settled');
});

test('a page nobody completed: the clock closes the attempt after a session\'s lifetime, and the payer may ask again', async () => {
  const runtime = await river();
  const { orderId, payKey } = await placed(runtime);
  await requestCheckoutFor(runtime, { payKey }, later(1));
  assert.equal(await closeAbandoned(runtime, later(120)), 0, 'a session lives three hours');
  assert.equal(await closeAbandoned(runtime, later(1 + 185)), 1);
  const view = await readOrder(runtime.store, runtime.root, orderId);
  assert.deepEqual([view?.status, view?.lastFailure?.reason, view?.session], ['retry', 'the session was not completed in time', null]);
  assert.equal(await closeAbandoned(runtime, later(400)), 0, 'said once for each session');
  const again = await requestCheckoutFor(runtime, { payKey }, later(401));
  assert.ok(again.ok && again.value.status === 'open' && again.value.redirectUrl?.includes('sim_paypal_'), 'the gate opens again, by another bank');
  assert.equal(await expireDue(runtime, later(73 * 60)), 0, 'and an invoice past its date is not withdrawn under the new attempt');
});

test('withdrawing a request: the merchant its own, an operator any, and nobody a settled one', async () => {
  const runtime = await river();
  const own = await placed(runtime);
  const notFound = { ok: false, errors: [{ field: 'order', code: 'notFound' }] };
  assert.deepEqual(await cancelOrderAs(runtime, { role: 'merchant', id: 'm-ceramics' }, own.orderId, 'not mine'), notFound);
  assert.deepEqual(await cancelOrderAs(runtime, { role: 'merchant', id: 'm-bakery' }, 'order_../../x', 'path'), notFound);
  assert.deepEqual(await cancelOrderAs(runtime, { role: 'merchant', id: 'm-bakery' }, own.orderId, 'sold out', later(1)), { ok: true, value: { orderId: own.orderId, status: 'cancelled' } });
  assert.deepEqual(await cancelOrderAs(runtime, { role: 'operator', id: 'helen' }, own.orderId, 'again'), { ok: false, errors: [{ field: 'order', code: 'settled' }] });
  assert.deepEqual(await requestCheckoutFor(runtime, { payKey: own.payKey }, later(2)), { ok: true, value: { orderId: own.orderId, status: 'cancelled', redirectUrl: null, standIn: false } });
  assert.deepEqual(await types(runtime, own.orderId), [payFacts.orderPlaced, payFacts.invoiceIssued, payFacts.cancellationRequested, payFacts.orderCancelled], 'asked at the door, decided by the figure; the gate of a withdrawn order hears no further word');

  const other = await placed(runtime);
  assert.equal((await cancelOrderAs(runtime, { role: 'operator', id: 'helen' }, other.orderId, '', later(1))).ok, true);
  const view = await readOrder(runtime.store, runtime.root, other.orderId);
  assert.deepEqual([view?.cancelled?.by, view?.cancelled?.reason], ['operator', 'withdrawn by an operator']);
  assert.deepEqual(await placeOrderAs(runtime, 'm-unknown', loaves), { ok: false, errors: [{ field: 'merchant', code: 'unknown' }] });
});

test('the settings refuse unsafe shapes at start, and read the constitution from the environment', () => {
  const cloud = { RIVER_STORE: 'firestore', K_SERVICE: 'pay-ingest' };
  assert.throws(() => readPayConfig({ RIVER_STORE: 'memory', K_SERVICE: 'x' }), /memory is not allowed/);
  assert.throws(() => readPayConfig({ ...local, PAY_STRIPE_MODE: 'connected', PAY_STRIPE_SECRET_KEY: 'sk_live_abc' }), /Live provider credentials are refused/);
  assert.throws(() => readPayConfig({ ...local, PAY_PAYPAL_MODE: 'connected', PAY_PAYPAL_API_BASE: 'https://api-m.paypal.com' }), /Live provider credentials are refused/);
  assert.throws(() => readPayConfig({ ...local, PAY_PAYPAL_API_BASE: 'https://evil.example' }), /sandbox or live API host/);
  assert.throws(() => readPayConfig({ ...cloud, PAY_STRIPE_MODE: 'simulated', PAY_PAYPAL_MODE: 'simulated' }), /needs PAY_ALLOW_SIMULATED=1/);
  assert.throws(() => readPayConfig({ RIVER_STORE: 'firestore', PAY_STRIPE_MODE: 'simulated' }), /needs PAY_ALLOW_SIMULATED=1/, 'a durable store anywhere, not only on Cloud Run');
  const firestoreElsewhere = readPayConfig({ RIVER_STORE: 'firestore', PAY_STRIPE_MODE: 'connected', PAY_STRIPE_SECRET_KEY: 'sk_test_x', PAY_MERCHANTS: '[{"id":"m1","name":"One","providers":["stripe"]}]' });
  assert.deepEqual([firestoreElsewhere.stripe.mode, firestoreElsewhere.paypal.mode], ['connected', 'off'], 'a provider nobody declared is never a stand-in beside a durable store');
  const oneDeclared = readPayConfig({ ...local, PAY_STRIPE_MODE: 'connected', PAY_STRIPE_SECRET_KEY: 'sk_test_x' });
  assert.deepEqual([oneDeclared.paypal.mode, oneDeclared.merchants.map((m) => [m.id, m.providers])], ['off', [['m-bakery', ['stripe']]]], 'nor beside a declared one; the fictional merchants keep what is mounted');
  assert.throws(() => readPayConfig({ ...cloud, PAY_MERCHANTS: '[{"id":"m1","name":"One","providers":["stripe"]}]' }), /Merchant m1 is connected to a provider that is not mounted \(stripe, paypal\)/);
  assert.deepEqual([readPayConfig(cloud).merchants, readPayConfig(cloud).stripe.mode, readPayConfig(cloud).paypal.mode], [[], 'off', 'off'], 'in the cloud nothing is mounted and nobody sells until infra says so');
  assert.throws(() => readPayConfig({ ...local, PAY_FEE_BPS: '2001' }), /PAY_FEE_BPS must be a whole number from 0 to 2000/);
  assert.throws(() => readPayConfig({ ...local, PAY_MERCHANTS: '[{"id":"M 1","name":"x","providers":["stripe"]}]' }), /PAY_MERCHANTS\[0\]/);
  assert.throws(() => readPayConfig({ ...local, PAY_MERCHANTS: '[{"id":"m1","name":"x","providers":["stripe","venmo"]}]' }), /PAY_MERCHANTS\[0\]/);
  assert.throws(() => readPayConfig({ ...local, PAY_ROUTING: '[{"provider":"stripe","currencies":["JPY"],"why":"x"}]' }), /PAY_ROUTING\[0\]/);
  assert.throws(() => readPayConfig({ ...local, PAY_DOOR_URL: 'http://door.internal' }), /https URL/);
  assert.throws(() => readPayConfig({ ...local, PAY_PUBLIC_URL: 'https://pay.example.org/path' }), /must be an origin/);
  assert.throws(() => readPayConfig({ ...local, PAY_BANK_URLS: '{"stripe":"http://bank.internal"}' }), /https URL/);

  const defaults = readPayConfig(local);
  assert.deepEqual([defaults.feeBps, defaults.invoiceTtlHours, defaults.carry, defaults.door, defaults.stripe.mode, defaults.paypal.mode, defaults.root, defaults.seed],
    [250, 72, 'inline', { at: 'here' }, 'simulated', 'simulated', 'orgs/open-river-aid', 'none']);
  assert.equal(readPayConfig({ RIVER_STORE: 'memory' }).seed, 'demo', 'a local memory river is seeded');

  const set = readPayConfig({
    ...cloud, RIVER_ORG_ID: 'acme', PAY_FIRESTORE_DATABASE: 'river-pay', PAY_CARRY: 'outbox', PAY_FEE_BPS: '180', PAY_INVOICE_TTL_HOURS: '24', PAY_STRIPE_MODE: 'connected', PAY_PAYPAL_MODE: 'off',
    PAY_PUBLIC_URL: 'https://pay.example.org/', PAY_MERCHANTS: '[{"id":"m1","name":"One","providers":["stripe"],"stripeAccount":"acct_1"}]',
    PAY_ROUTING: '[{"provider":"stripe","currencies":["EUR"],"maxMinor":null,"why":"only Stripe, only euros"}]',
  });
  assert.deepEqual([set.root, set.database, set.carry, set.feeBps, set.invoiceTtlHours, set.publicUrl, set.seed], ['orgs/acme', 'river-pay', 'outbox', 180, 24, 'https://pay.example.org', 'none']);
  assert.deepEqual(set.merchants, [{ id: 'm1', name: 'One', providers: ['stripe'], stripeAccount: 'acct_1', paypalMerchantId: null }]);
  assert.deepEqual(set.routing, [{ provider: 'stripe', currencies: ['EUR'], maxMinor: null, why: 'only Stripe, only euros' }]);
  assert.equal(readPayConfig({ ...cloud, PAY_DOOR_URL: 'https://door.example.run.app/' }).door.at, 'remote', 'a cabinet that only reads needs no provider at all');
});

test('the door admits four gestures and nothing else', () => {
  assert.deepEqual(parseDoorAct({ act: 'placeOrder', merchantId: 'm1', input: { ...loaves, extra: 'dropped' } }), { act: 'placeOrder', merchantId: 'm1', input: loaves });
  assert.deepEqual(parseDoorAct({ act: 'requestCheckout', by: { payKey: 'k'.repeat(43) } }), { act: 'requestCheckout', by: { payKey: 'k'.repeat(43) } });
  assert.deepEqual(parseDoorAct({ act: 'cancelOrder', orderId: 'order_1', by: { role: 'operator', id: 'helen' }, reason: '' }), { act: 'cancelOrder', orderId: 'order_1', by: { role: 'operator', id: 'helen' }, reason: '' });
  assert.deepEqual(parseDoorAct({ act: 'simulateOutcome', sessionRef: 's1', outcome: 'declined', by: { payerRef: 'anna.k' } }), { act: 'simulateOutcome', sessionRef: 's1', outcome: 'declined', by: { payerRef: 'anna.k' } });
  for (const bad of [
    null, 'placeOrder', [], { act: 'capturePayment', orderId: 'order_1' }, { act: 'placeOrder', merchantId: 'm1', input: { title: 'x' } }, { act: 'placeOrder', merchantId: 'm1', input: { ...loaves, title: 'x'.repeat(501) } },
    { act: 'requestCheckout', by: { orderId: 'order_1' } }, { act: 'cancelOrder', orderId: 'order_1', by: { role: 'payer', id: 'a' }, reason: '' }, { act: 'simulateOutcome', sessionRef: 's1', outcome: 'refunded', by: { payerRef: 'anna.k' } }, { act: 'simulateOutcome', sessionRef: 's1', outcome: 'paid' },
  ]) assert.equal(parseDoorAct(bad), null, JSON.stringify(bad));
});

// A bank that answers from a script and remembers what it was asked.
function bank() {
  const script: Array<{ status: number; body: unknown }> = [];
  const calls: Array<{ url: string; headers: Record<string, string>; body: string }> = [];
  const send: FetchLike = async (url, init) => {
    calls.push({ url, headers: init.headers, body: init.body ?? '' });
    const next = script.shift() ?? { status: 599, body: { error: 'the script is empty' } };
    return { ok: next.status >= 200 && next.status < 300, status: next.status, text: async () => JSON.stringify(next.body) };
  };
  return { send, calls, script };
}

// The river cut into functions: each holds only its own secret, all share one store, and the test
// plays the messaging layer — it delivers every new outbox document to a bank function, as Eventarc would.
async function functions() {
  const store = createMemoryStore();
  const world = bank();
  const shape = { RIVER_STORE: 'memory', PAY_SEED: 'none', PAY_CARRY: 'outbox', PAY_STRIPE_MODE: 'connected', PAY_PAYPAL_MODE: 'connected', PAY_PUBLIC_URL: 'https://pay.example.org' };
  const calls: string[] = [];
  // One function calling another: the clock waking a bank. The test routes the call to that bank's handler.
  const call: FunctionCall = async (url, request) => {
    calls.push(url);
    const bank = url === 'https://stripe-bank.example' ? f.stripeBank : f.paypalBank;
    const answer = await handleDischarge(bank, { method: 'POST', path: '/', headers: request.headers, body: request.body });
    return { status: answer.status, body: JSON.stringify(answer.body) };
  };
  const make = (settings: Record<string, string> = {}) => createPayRuntime(readPayConfig({ ...shape, ...settings }), { store, fetch: world.send, call });
  const paypalKeys = { PAY_PAYPAL_CLIENT_ID: 'id', PAY_PAYPAL_SECRET: 'sec' };
  const f = {
    door: await make(),
    stripeBank: await make({ PAY_STRIPE_SECRET_KEY: 'sk_test_x' }),
    stripeHook: await make({ PAY_STRIPE_WEBHOOK_SECRET: 'whsec_test' }),
    paypalBank: await make(paypalKeys),
    paypalHook: await make({ ...paypalKeys, PAY_PAYPAL_WEBHOOK_ID: 'WH-ID' }),
    clock: await make({ PAY_BANK_URLS: '{"stripe":"https://stripe-bank.example","paypal":"https://paypal-bank.example"}' }),
  };
  const post = (body: unknown, headers: Record<string, string> = {}): FunctionRequest => ({ method: 'POST', path: '/', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
  const event = (entry: OutboxEntry) => post('', { 'ce-type': 'google.cloud.firestore.document.v1.created', 'ce-document': figurePaths.intention(f.door.root, entry.controller, entry.stream, entry.seq) });
  const waiting = () => readOutbox(store, f.door.root, f.door.assembly);
  const view = (orderId: string) => readOrder(store, f.door.root, orderId);
  const ingest = async (act: unknown) => (await handleIngest(f.door, post(act))).body as { ok: boolean; orderId: string; payKey: string; status: string; redirectUrl: string | null };
  return { ...f, store, world, calls, post, event, waiting, view, ingest };
}

const signed = (payload: string, secret = 'whsec_test') => {
  const t = Math.floor(Date.now() / 1000);
  return { 'stripe-signature': `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}` };
};

test('cut into functions (Stripe): the door writes the intention, the bank function carries it, the webhook function settles it', async () => {
  const f = await functions();
  const { orderId, payKey } = await f.ingest({ act: 'placeOrder', merchantId: 'm-bakery', input: loaves });
  assert.deepEqual([(await f.ingest({ act: 'requestCheckout', by: { payKey } })).status, f.world.calls.length], ['routing', 0], 'the door reaches no provider');
  assert.deepEqual((await handleIngest(f.door, f.post({ act: 'capturePayment', orderId }))).status, 400);
  assert.deepEqual((await handleIngest(f.door, f.post({ act: 'requestCheckout', by: { payKey: 'x'.repeat(43) } }))).status, 422);

  const [intention] = await f.waiting();
  assert.deepEqual([intention?.controller, intention?.seq, intention?.attempts], ['stripe', 4, 0]);
  const delivery = f.event(intention as OutboxEntry);
  assert.deepEqual(await handleDischarge(f.paypalBank, delivery), { status: 500, body: { error: 'this function does not hold the credentials of stripe' } });
  assert.deepEqual([(await f.waiting())[0]?.attempts, f.world.calls.length], [0, 0], 'a misplaced message counts no attempt and calls nobody');
  assert.deepEqual(await handleDischarge(f.stripeBank, f.post('', { 'ce-document': 'orgs/other/outbox/stripe/intentions/x-000000001' })), { status: 200, body: { carried: false, ignored: 'not an outbox entry of this river' } }, 'an event that can never be carried is acknowledged, so it is not delivered again for a day');

  f.world.script.push({ status: 200, body: { id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' } });
  assert.deepEqual(await handleDischarge(f.stripeBank, delivery), { status: 200, body: { carried: true, facts: 1, duplicate: false } });
  assert.deepEqual(await handleDischarge(f.stripeBank, delivery), { status: 200, body: { carried: false } }, 'the same event delivered again does nothing');
  const [call] = f.world.calls;
  assert.deepEqual([f.world.calls.length, call?.headers['idempotency-key'], call?.headers.authorization, new URLSearchParams(call?.body).get('success_url')],
    [1, `${orderId}-4`, 'Bearer sk_test_x', `https://pay.example.org/pay/return/${orderId}`]);
  assert.deepEqual([(await f.view(orderId))?.status, (await f.view(orderId))?.session?.redirectUrl], ['open', 'https://checkout.stripe.com/c/pay/cs_test_1']);

  const completed = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed', data: { object: { id: 'cs_test_1', client_reference_id: orderId, payment_status: 'paid', payment_intent: 'pi_9', amount_total: 12_000, currency: 'eur' } } });
  assert.deepEqual(await handleStripeWebhook(f.stripeHook, f.post(completed, signed(completed, 'whsec_other'))), { status: 400, body: { outcome: 'rejected' } });
  assert.deepEqual(await handleStripeWebhook(f.stripeHook, f.post(completed.replace('12000', '1'), signed(completed))), { status: 400, body: { outcome: 'rejected' } }, 'a body changed after signing');
  assert.deepEqual(await handleStripeWebhook(f.door, f.post(completed, signed(completed))), { status: 503, body: { outcome: 'unavailable' } }, 'a function without the secret believes nothing');
  assert.equal((await f.view(orderId))?.status, 'open');
  assert.deepEqual(await handleStripeWebhook(f.stripeHook, f.post(completed, signed(completed))), { status: 200, body: { outcome: 'accepted' } });
  assert.deepEqual(await handleStripeWebhook(f.stripeHook, f.post(completed, signed(completed))), { status: 200, body: { outcome: 'accepted' } });
  const paid = await f.view(orderId);
  assert.deepEqual([paid?.status, paid?.paid?.providerRef, paid?.paid?.simulated, paid?.seq], ['paid', 'pi_9', false, 9], 'settled once, however often it is told');
  const stranger = JSON.stringify({ id: 'evt_2', type: 'checkout.session.completed', data: { object: { id: 'cs_x', client_reference_id: 'order_00000000000000000000000000', payment_status: 'paid', amount_total: 5, currency: 'eur' } } });
  assert.deepEqual(await handleStripeWebhook(f.stripeHook, f.post(stranger, signed(stranger))), { status: 200, body: { outcome: 'ignored' } }, 'another product\'s event is not this river\'s business');
  assert.deepEqual([(await f.waiting()).length, await checkOrder(f.clock, orderId)], [0, { facts: 10, view: true, state: true, outbox: true }]);
});

test('cut into functions (PayPal): approval by webhook, then the capture — two intentions, two deliveries', async () => {
  const f = await functions();
  const { orderId, payKey } = await f.ingest({ act: 'placeOrder', merchantId: 'm-bakery', input: { title: 'Birthday cake', amount: '35', currency: 'USD', payerRef: 'anna.k' } });
  await f.ingest({ act: 'requestCheckout', by: { payKey } });
  f.world.script.push({ status: 200, body: { access_token: 'A1', expires_in: 32_400 } }, { status: 201, body: { id: 'PP-1', links: [{ rel: 'approve', href: 'https://www.sandbox.paypal.com/checkoutnow?token=PP-1' }] } });
  assert.equal((await handleDischarge(f.paypalBank, f.event((await f.waiting())[0] as OutboxEntry))).status, 200);
  assert.equal((await f.view(orderId))?.session?.sessionRef, 'PP-1');
  const stranger = { id: 'WH-0', event_type: 'CHECKOUT.ORDER.APPROVED', resource: { id: 'PP-9', purchase_units: [{ custom_id: 'order_00000000000000000000000000' }] } };
  const before = f.world.calls.length;
  assert.deepEqual([await handlePaypalWebhook(f.paypalHook, f.post(stranger, { 'paypal-transmission-sig': 'x' })), f.world.calls.length - before], [{ status: 200, body: { outcome: 'ignored' } }, 0], 'an event that names no order of this river costs PayPal nothing');

  const approved = { id: 'WH-1', event_type: 'CHECKOUT.ORDER.APPROVED', resource: { id: 'PP-1', purchase_units: [{ custom_id: orderId }] } };
  const headers = { 'paypal-auth-algo': 'SHA256withRSA', 'paypal-cert-url': 'https://api.paypal.com/cert', 'paypal-transmission-id': 't1', 'paypal-transmission-sig': 'sig', 'paypal-transmission-time': '2026-10-01T10:00:00Z' };
  f.world.script.push({ status: 200, body: { access_token: 'A2' } }, { status: 200, body: { verification_status: 'FAILURE' } });
  assert.deepEqual(await handlePaypalWebhook(f.paypalHook, f.post(approved, headers)), { status: 400, body: { outcome: 'rejected' } });
  assert.deepEqual(await handlePaypalWebhook(f.paypalBank, f.post(approved, headers)), { status: 503, body: { outcome: 'unavailable' } }, 'the bank function is not the webhook function');
  f.world.script.push({ status: 200, body: { access_token: 'A3' } }, { status: 200, body: { verification_status: 'SUCCESS' } });
  assert.deepEqual(await handlePaypalWebhook(f.paypalHook, f.post(approved, headers)), { status: 200, body: { outcome: 'accepted' } });
  assert.equal((await f.view(orderId))?.status, 'approved');

  const [capture] = await f.waiting();
  assert.deepEqual([capture?.controller, capture?.type], ['paypal', payFacts.providerCaptureRequested]);

  // The merchant tries to withdraw while the capture is on its way: refused, so the money cannot land on a withdrawn order.
  assert.deepEqual(await f.ingest({ act: 'cancelOrder', orderId, by: { role: 'merchant', id: 'm-bakery' }, reason: 'changed my mind' }), { ok: false, errors: [{ field: 'order', code: 'collecting' }] });

  // PayPal is down: the capture is tried, and tried again, and never called a failure.
  for (let i = 0; i < 4; i += 1) {
    f.world.script.push({ status: 503, body: {} });
    assert.equal((await handleDischarge(f.paypalBank, f.event(capture as OutboxEntry))).status, 500);
  }
  assert.deepEqual([(await f.view(orderId))?.status, (await f.waiting())[0]?.attempts], ['approved', 4], 'still being collected; the payer is not sent to pay again');

  // PayPal answers: accepted, but pending its review. Not money yet, and not a failure.
  f.world.script.push({ status: 201, body: { status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ id: 'CAP-7', status: 'PENDING', status_details: { reason: 'PENDING_REVIEW' }, amount: { currency_code: 'USD', value: '35.00' } }] } }] } });
  assert.equal((await handleDischarge(f.paypalBank, f.event(capture as OutboxEntry))).status, 200);
  assert.equal(f.world.calls.at(-1)?.headers['paypal-request-id'], `${orderId}-${capture?.seq}`, 'the same key on every attempt');
  const held = await f.view(orderId);
  assert.deepEqual([held?.status, held?.attempts.open?.capture, held?.postings.length, (await f.waiting()).length], ['approved', 'pending', 0, 0]);
  assert.deepEqual(await f.ingest({ act: 'requestCheckout', by: { payKey } }), { ok: true, orderId, status: 'approved', payKey: null, redirectUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=PP-1', standIn: false }, 'asking again opens no second attempt');

  // PayPal reports the outcome itself.
  const completed = { id: 'WH-2', event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: { id: 'CAP-7', custom_id: orderId, amount: { currency_code: 'USD', value: '35.00' }, supplementary_data: { related_ids: { order_id: 'PP-1' } } } };
  f.world.script.push({ status: 200, body: { access_token: 'A5', expires_in: 32_400 } }, { status: 200, body: { verification_status: 'SUCCESS' } });
  assert.deepEqual(await handlePaypalWebhook(f.paypalHook, f.post(completed, headers)), { status: 200, body: { outcome: 'accepted' } });
  const paid = await f.view(orderId);
  assert.deepEqual([paid?.status, paid?.paid?.providerRef, paid?.postings.length], ['paid', 'CAP-7', 3]);
  assert.deepEqual(await checkOrder(f.clock, orderId), { facts: 15, view: true, state: true, outbox: true });
});

test('cut into functions: the clock wakes a bank whose intention has waited too long', async () => {
  const f = await functions();
  const { orderId, payKey } = await f.ingest({ act: 'placeOrder', merchantId: 'm-bakery', input: loaves });
  await requestCheckoutFor(f.door, { payKey }, new Date(Date.now() - 10 * 60_000));
  assert.deepEqual((await handleTick(f.door, f.post(''))).body, { expired: 0, abandoned: 0, carried: 0, waiting: 1, stale: 1, woken: 0 }, 'a function that knows no bank address only reports');

  f.world.script.push({ status: 200, body: { id: 'cs_test_9', url: 'https://checkout.stripe.com/c/pay/cs_test_9' } });
  assert.deepEqual((await handleTick(f.clock, f.post(''))).body, { expired: 0, abandoned: 0, carried: 0, waiting: 1, stale: 1, woken: 1 });
  assert.deepEqual([f.calls, (await f.view(orderId))?.status, (await f.waiting()).length], [['https://stripe-bank.example'], 'open', 0], 'the bank was called as the messaging layer would have called it');
  assert.equal(f.world.calls[0]?.headers['idempotency-key'], `${orderId}-4`, 'with the intention\'s own key, so a late first delivery repeats nothing');
  assert.deepEqual((await handleTick(f.clock, f.post(''))).body, { expired: 0, abandoned: 0, carried: 0, waiting: 0, stale: 0, woken: 0 });
});

test('cut into functions: an outage is delivered again, and the third failure is a fact', async () => {
  const f = await functions();
  const { orderId, payKey } = await f.ingest({ act: 'placeOrder', merchantId: 'm-bakery', input: loaves });
  await f.ingest({ act: 'requestCheckout', by: { payKey } });

  const delivery = f.event((await f.waiting())[0] as OutboxEntry);
  f.world.script.push({ status: 503, body: {} }, { status: 503, body: {} }, { status: 503, body: {} });
  assert.deepEqual(await handleDischarge(f.stripeBank, delivery), { status: 500, body: { error: 'Stripe is unavailable (503)' } });
  assert.deepEqual([(await f.waiting())[0]?.attempts, (await f.waiting())[0]?.lastError], [1, 'Stripe is unavailable (503)']);
  assert.equal((await handleDischarge(f.stripeBank, delivery)).status, 500);
  assert.deepEqual(await handleDischarge(f.stripeBank, delivery), { status: 200, body: { carried: true, facts: 1, duplicate: false } });
  const view = await f.view(orderId);
  assert.deepEqual([view?.status, view?.lastFailure?.reason, (await f.waiting()).length], ['retry', 'Stripe is unavailable (503)', 0]);
  assert.equal((await handleTick(f.clock, { method: 'GET', path: '/', headers: {}, body: '' })).status, 405);
});

test('the seeded demo: every place the line can end, made through the real doors — conserved, and equal to its streams', async () => {
  const runtime = await river();
  await seedPayDemo(runtime, new Date('2026-10-01T12:00:00.000Z'));
  const orders = await readAllOrders(runtime.store, runtime.root);
  assert.deepEqual(orders.map((o) => [o.title, o.status, o.route?.provider ?? null]), [
    ['Rye loaves, standing order', 'invoiced', null],
    ['Sourdough course, Saturday', 'invoiced', null],
    ['Two serving bowls', 'refused', null],
    ['Set of six cups', 'retry', 'paypal'],
    ['Catering deposit', 'flagged', 'stripe'],
    ['Birthday cake', 'paid', 'paypal'],
    ['Croissants, a dozen', 'cancelled', null],
    ['Bread for the week — forty loaves', 'paid', 'stripe'],
    ['Glaze workshop voucher', 'invoiced', null],
  ]);
  const ledger = ledgerSummary(orders);
  assert.equal(ledger.balanced, true);
  assert.deepEqual(ledger.totals, [
    { currency: 'EUR', orders: 1, capturedMinor: 12_000, feesMinor: 300, payableMinor: 11_700 },
    { currency: 'USD', orders: 1, capturedMinor: 3_500, feesMinor: 88, payableMinor: 3_412 },
  ]);
  for (const order of orders) assert.deepEqual([order.title, await checkOrder(runtime, order.orderId).then((c) => c?.view && c.state && c.outbox)], [order.title, true]);
  assert.equal(Object.keys(runtime.demoPayKeys).length, 9);
  assert.equal((await carryPending(runtime)).left, 0, 'nothing is left waiting at a bank');
  assert.equal(await expireDue(runtime, new Date('2026-10-01T12:00:00.000Z')), 1, 'the voucher past its date waits for the clock');
});
