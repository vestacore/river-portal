import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { payFacts } from '@river/pay-facts';
import type { Fact } from '@river/stream';
import {
  paypalEventFacts, paypalProvider, simulatedOutcome, simulatedProvider, stripeEventFacts, stripeProvider, stripeSignatureValid,
  toDecimal, toMinor, verifyPaypalEvent, type FetchLike,
} from './gate.ts';

const intention = (type: string, payload: Record<string, unknown>): Fact => ({ stream: 'order_1', seq: 3, type, payload, origin: { via: 'figure', by: 'openGate' }, wave: 1, causedBy: 2, at: '2026-10-01T10:00:00.000Z' });
const session = (provider: string) => intention(payFacts.providerSessionRequested, { provider, attempt: 1, orderId: 'order_1', invoiceId: 'inv-order_1', merchantId: 'm1', title: 'Ten loaves', amountMinor: 12_000, currency: 'EUR', feeMinor: 300 });

// A bank that answers from a script and remembers what it was asked.
function bank(script: Array<{ status: number; body: unknown }>) {
  const calls: Array<{ url: string; method: string; headers: Record<string, string>; body: string }> = [];
  const send: FetchLike = async (url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body ?? '' });
    const next = script.shift() ?? { status: 500, body: {} };
    return { ok: next.status >= 200 && next.status < 300, status: next.status, text: async () => JSON.stringify(next.body) };
  };
  return { send, calls };
}

test('amounts cross to a provider and back without floating point', () => {
  assert.equal(toDecimal(12_000), '120.00');
  assert.equal(toDecimal(7), '0.07');
  assert.equal(toMinor('120.00'), 12_000);
  assert.equal(toMinor('0.5'), 50);
  assert.equal(toMinor('1,000.00'), null);
  assert.throws(() => toDecimal(1.5));
});

test('Stripe: one hosted session per attempt, idempotent, split by Stripe when the merchant is connected', async () => {
  const { send, calls } = bank([{ status: 200, body: { id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' } }]);
  const stripe = stripeProvider({ secretKey: 'sk_test_x', returnUrl: (id) => `https://pay.example/return/${id}`, accountFor: () => 'acct_42', sessionTtlMinutes: 180, fetch: send });
  assert.equal(stripe.accepts?.(session('stripe')), true);
  assert.equal(stripe.accepts?.(session('paypal')), false);
  const answer = await stripe.discharge(session('stripe'), 'order_1-3');
  assert.deepEqual(answer, [{ type: payFacts.providerSessionOpened, payload: { provider: 'stripe', attempt: 1, sessionRef: 'cs_test_1', redirectUrl: 'https://checkout.stripe.com/c/pay/cs_test_1', simulated: false } }]);
  const [call] = calls;
  assert.equal(call?.url, 'https://api.stripe.com/v1/checkout/sessions');
  assert.equal(call?.headers['idempotency-key'], 'order_1-3');
  assert.equal(call?.headers.authorization, 'Bearer sk_test_x');
  const form = new URLSearchParams(call?.body);
  assert.deepEqual(
    ['mode', 'client_reference_id', 'line_items[0][price_data][currency]', 'line_items[0][price_data][unit_amount]', 'payment_intent_data[application_fee_amount]', 'payment_intent_data[transfer_data][destination]'].map((k) => form.get(k)),
    ['payment', 'order_1', 'eur', '12000', '300', 'acct_42'],
  );
  assert.equal(form.get('expires_at'), String(Date.parse('2026-10-01T10:00:00.000Z') / 1000 + 180 * 60), 'the page closes when the river says, counted from the intention — the same on every retry');
});

test('Stripe: a refusal is an answer; an outage is thrown to be tried again; exhaustion becomes a fact', async () => {
  const refused = bank([{ status: 402, body: { error: { message: 'Your account cannot currently make live charges.' } } }]);
  const stripe = stripeProvider({ secretKey: 'sk_test_x', returnUrl: () => 'https://pay.example/r', accountFor: () => null, sessionTtlMinutes: 5, fetch: refused.send });
  assert.deepEqual(await stripe.discharge(session('stripe'), 'k'), [{ type: payFacts.providerSessionFailed, payload: { provider: 'stripe', attempt: 1, reason: 'Your account cannot currently make live charges.' } }]);
  assert.equal(new URLSearchParams(refused.calls[0]?.body).has('payment_intent_data[application_fee_amount]'), false, 'no split without a connected account');

  assert.equal(new URLSearchParams(refused.calls[0]?.body).get('expires_at'), String(Date.parse('2026-10-01T10:00:00.000Z') / 1000 + 30 * 60), 'never shorter than Stripe allows');

  const down = stripeProvider({ secretKey: 'sk_test_x', returnUrl: () => 'r', accountFor: () => null, sessionTtlMinutes: 180, fetch: bank([{ status: 503, body: {} }, { status: 409, body: { error: { message: 'Keys for idempotent requests can only be used once at a time' } } }]).send });
  await assert.rejects(down.discharge(session('stripe'), 'k'), /Stripe is unavailable \(503\)/);
  await assert.rejects(down.discharge(session('stripe'), 'k'), /Stripe is unavailable \(409\)/, 'a key still in use by an unfinished request is not a refusal');
  assert.deepEqual(down.exhausted(session('stripe'), 'Stripe is unavailable (503)'), [{ type: payFacts.providerSessionFailed, payload: { provider: 'stripe', attempt: 1, reason: 'Stripe is unavailable (503)' } }]);
});

test('Stripe webhooks: the signature covers the raw body and a recent timestamp', () => {
  const payload = '{"id":"evt_1","type":"checkout.session.completed"}';
  const secret = 'whsec_test';
  const sign = (t: number, body = payload, key = secret) => `t=${t},v1=${createHmac('sha256', key).update(`${t}.${body}`).digest('hex')}`;
  assert.equal(stripeSignatureValid({ payload, header: sign(1_000), secret, nowSeconds: 1_100 }), true);
  assert.equal(stripeSignatureValid({ payload, header: `${sign(1_000)},v0=legacy`, secret, nowSeconds: 1_100 }), true);
  assert.equal(stripeSignatureValid({ payload, header: sign(1_000), secret, nowSeconds: 1_301 }), false, 'too old');
  assert.equal(stripeSignatureValid({ payload: payload.replace('evt_1', 'evt_2'), header: sign(1_000), secret, nowSeconds: 1_100 }), false, 'the body was changed');
  assert.equal(stripeSignatureValid({ payload, header: sign(1_000, payload, 'whsec_other'), secret, nowSeconds: 1_100 }), false, 'another secret');
  assert.equal(stripeSignatureValid({ payload, header: 'v1=abc', secret, nowSeconds: 1_100 }), false);
  assert.equal(stripeSignatureValid({ payload, header: sign(1_000), secret: '', nowSeconds: 1_100 }), false);
});

test('Stripe events become facts for one order — as reported, for the mouth to check', () => {
  const completed = { id: 'evt_1', type: 'checkout.session.completed', data: { object: { id: 'cs_test_1', client_reference_id: 'order_1', payment_status: 'paid', payment_intent: 'pi_9', amount_total: 12_000, currency: 'eur' } } };
  assert.deepEqual(stripeEventFacts(completed), { orderId: 'order_1', eventId: 'evt_1', drafts: [{ type: payFacts.paymentCaptured, payload: { provider: 'stripe', sessionRef: 'cs_test_1', providerRef: 'pi_9', amountMinor: 12_000, currency: 'EUR', simulated: false } }] });
  assert.equal(stripeEventFacts({ ...completed, data: { object: { ...completed.data.object, payment_status: 'unpaid' } } }), null, 'completed but unpaid is not a capture');
  assert.equal(stripeEventFacts({ ...completed, type: 'checkout.session.async_payment_succeeded', data: { object: { ...completed.data.object, payment_status: 'unpaid' } } })?.drafts[0]?.type, payFacts.paymentCaptured, 'a delayed payment that succeeded');
  assert.deepEqual(stripeEventFacts({ ...completed, type: 'checkout.session.expired' })?.drafts, [{ type: payFacts.providerSessionExpired, payload: { provider: 'stripe', sessionRef: 'cs_test_1', reason: 'the session expired at Stripe' } }]);
  assert.equal(stripeEventFacts({ ...completed, type: 'checkout.session.async_payment_failed' })?.drafts[0]?.type, payFacts.paymentFailed);
  assert.equal(stripeEventFacts({ id: 'evt_2', type: 'customer.created', data: { object: { id: 'cus_1' } } }), null);
  assert.equal(stripeEventFacts('nonsense'), null);
});

test('PayPal: an order to approve, then a capture the river asks for — both idempotent, split by PayPal', async () => {
  const { send, calls } = bank([
    { status: 200, body: { access_token: 'A21', expires_in: 32_400 } },
    { status: 201, body: { id: 'PP-1', links: [{ rel: 'self', href: 'x' }, { rel: 'approve', href: 'https://www.sandbox.paypal.com/checkoutnow?token=PP-1' }] } },
    { status: 201, body: { status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ id: 'CAP-7', status: 'COMPLETED', amount: { currency_code: 'EUR', value: '120.00' } }] } }] } },
  ]);
  const paypal = paypalProvider({ clientId: 'id', secret: 'sec', apiBase: 'https://api-m.sandbox.paypal.com', returnUrl: (id) => `https://pay.example/return/${id}`, payeeFor: () => 'MERCHANT9', fetch: send });
  assert.deepEqual(await paypal.discharge(session('paypal'), 'order_1-3'), [{ type: payFacts.providerSessionOpened, payload: { provider: 'paypal', attempt: 1, sessionRef: 'PP-1', redirectUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=PP-1', simulated: false } }]);
  assert.equal(calls[0]?.headers.authorization, `Basic ${Buffer.from('id:sec').toString('base64')}`);
  assert.equal(calls[1]?.headers['paypal-request-id'], 'order_1-3');
  const order = JSON.parse(calls[1]?.body ?? '{}') as { intent: string; purchase_units: Array<{ custom_id: string; amount: unknown; payee: unknown; payment_instruction: { platform_fees: unknown } }> };
  assert.equal(order.intent, 'CAPTURE');
  assert.deepEqual(order.purchase_units[0]?.amount, { currency_code: 'EUR', value: '120.00' });
  assert.deepEqual(order.purchase_units[0]?.payee, { merchant_id: 'MERCHANT9' });
  assert.deepEqual(order.purchase_units[0]?.payment_instruction.platform_fees, [{ amount: { currency_code: 'EUR', value: '3.00' } }]);

  const capture = intention(payFacts.providerCaptureRequested, { provider: 'paypal', sessionRef: 'PP-1', orderId: 'order_1', amountMinor: 12_000, currency: 'EUR' });
  assert.deepEqual(await paypal.discharge(capture, 'order_1-6'), [{ type: payFacts.paymentCaptured, payload: { provider: 'paypal', sessionRef: 'PP-1', providerRef: 'CAP-7', amountMinor: 12_000, currency: 'EUR', simulated: false } }]);
  assert.equal(calls.length, 3, 'the access token is asked for once and kept by this process');
  assert.equal(calls[2]?.url, 'https://api-m.sandbox.paypal.com/v2/checkout/orders/PP-1/capture');
  assert.equal(calls[2]?.headers['paypal-request-id'], 'order_1-6');
});

test('PayPal captures: only PayPal\'s own "no" is a failure — pending is pending, already captured is read back, an outage is never given up', async () => {
  const options = { clientId: 'id', secret: 'sec', apiBase: 'https://api-m.sandbox.paypal.com', returnUrl: () => 'r', payeeFor: () => null };
  const capture = intention(payFacts.providerCaptureRequested, { provider: 'paypal', sessionRef: 'PP-1', orderId: 'order_1', amountMinor: 12_000, currency: 'EUR' });
  const token = { status: 200, body: { access_token: 'A', expires_in: 32_400 } };
  const captured = { id: 'CAP-7', status: 'COMPLETED', amount: { currency_code: 'EUR', value: '120.00' } };

  const pending = paypalProvider({ ...options, fetch: bank([token, { status: 201, body: { status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ ...captured, status: 'PENDING', status_details: { reason: 'PENDING_REVIEW' } }] } }] } }]).send });
  assert.deepEqual(await pending.discharge(capture, 'k'), [{ type: payFacts.paymentPending, payload: { provider: 'paypal', sessionRef: 'PP-1', providerRef: 'CAP-7', reason: 'PENDING_REVIEW' } }], 'held by PayPal: not money yet, and not a failure');

  const twice = bank([token, { status: 422, body: { name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'ORDER_ALREADY_CAPTURED' }], message: 'The requested action could not be performed.' } }, { status: 200, body: { id: 'PP-1', status: 'COMPLETED', purchase_units: [{ payments: { captures: [captured] } }] } }]);
  assert.deepEqual(await paypalProvider({ ...options, fetch: twice.send }).discharge(capture, 'k'), [{ type: payFacts.paymentCaptured, payload: { provider: 'paypal', sessionRef: 'PP-1', providerRef: 'CAP-7', amountMinor: 12_000, currency: 'EUR', simulated: false } }], 'money an earlier request captured is found, not denied');
  assert.deepEqual([twice.calls[2]?.method, twice.calls[2]?.url], ['GET', 'https://api-m.sandbox.paypal.com/v2/checkout/orders/PP-1']);

  const declined = paypalProvider({ ...options, fetch: bank([token, { status: 422, body: { details: [{ issue: 'INSTRUMENT_DECLINED' }], message: 'The requested action could not be performed.' } }]).send });
  assert.deepEqual(await declined.discharge(capture, 'k'), [{ type: payFacts.paymentFailed, payload: { provider: 'paypal', sessionRef: 'PP-1', reason: 'INSTRUMENT_DECLINED' } }]);

  const down = paypalProvider({ ...options, fetch: bank([token, { status: 503, body: {} }, { status: 409, body: {} }]).send });
  await assert.rejects(down.discharge(capture, 'k'), /PayPal is unavailable \(503\)/);
  await assert.rejects(down.discharge(capture, 'k'), /PayPal is unavailable \(409\)/);
  assert.equal(down.exhausted(capture, 'PayPal is unavailable (503)'), null, 'nothing is known of the money, so nothing is claimed: the capture keeps being asked for');
  assert.deepEqual(down.exhausted(session('paypal'), 'PayPal is unavailable (503)'), [{ type: payFacts.providerSessionFailed, payload: { provider: 'paypal', attempt: 1, reason: 'PayPal is unavailable (503)' } }], 'a page that never opened moved nothing');
});

test('PayPal: refusals are answers, outages are thrown, and only its own webhooks are believed', async () => {
  const options = { clientId: 'id', secret: 'sec', apiBase: 'https://api-m.sandbox.paypal.com', returnUrl: () => 'r', payeeFor: () => null };
  const refused = paypalProvider({ ...options, fetch: bank([{ status: 200, body: { access_token: 'A' } }, { status: 422, body: { message: 'ORDER_NOT_APPROVED' } }]).send });
  const capture = intention(payFacts.providerCaptureRequested, { provider: 'paypal', sessionRef: 'PP-1', orderId: 'order_1', amountMinor: 12_000, currency: 'EUR' });
  assert.deepEqual(await refused.discharge(capture, 'k'), [{ type: payFacts.paymentFailed, payload: { provider: 'paypal', sessionRef: 'PP-1', reason: 'ORDER_NOT_APPROVED' } }]);
  const down = paypalProvider({ ...options, fetch: bank([{ status: 200, body: { access_token: 'A' } }, { status: 500, body: {} }]).send });
  await assert.rejects(down.discharge(session('paypal'), 'k'), /PayPal is unavailable \(500\)/);

  const approved = { id: 'WH-1', event_type: 'CHECKOUT.ORDER.APPROVED', resource: { id: 'PP-1', purchase_units: [{ custom_id: 'order_1' }] } };
  assert.deepEqual(paypalEventFacts(approved), { orderId: 'order_1', eventId: 'WH-1', drafts: [{ type: payFacts.providerSessionApproved, payload: { provider: 'paypal', sessionRef: 'PP-1' } }] });
  const captureEvent = (event_type: string, extra: Record<string, unknown> = {}) => ({ id: 'WH-2', event_type, resource: { id: 'CAP-7', custom_id: 'order_1', amount: { currency_code: 'EUR', value: '120.00' }, supplementary_data: { related_ids: { order_id: 'PP-1' } }, ...extra } });
  assert.deepEqual(paypalEventFacts(captureEvent('PAYMENT.CAPTURE.COMPLETED'))?.drafts, [{ type: payFacts.paymentCaptured, payload: { provider: 'paypal', sessionRef: 'PP-1', providerRef: 'CAP-7', amountMinor: 12_000, currency: 'EUR', simulated: false } }], 'what became of a capture PayPal held pending');
  assert.deepEqual(paypalEventFacts(captureEvent('PAYMENT.CAPTURE.PENDING', { status_details: { reason: 'ECHECK' } }))?.drafts, [{ type: payFacts.paymentPending, payload: { provider: 'paypal', sessionRef: 'PP-1', providerRef: 'CAP-7', reason: 'ECHECK' } }]);
  assert.deepEqual(paypalEventFacts(captureEvent('PAYMENT.CAPTURE.DECLINED'))?.drafts, [{ type: payFacts.paymentFailed, payload: { provider: 'paypal', sessionRef: 'PP-1', reason: 'PayPal declined the capture' } }]);
  assert.equal(paypalEventFacts(captureEvent('PAYMENT.CAPTURE.REFUNDED')), null, 'refunds are not this river\'s business yet');
  assert.equal(paypalEventFacts({ id: 'WH-3', event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: { id: 'CAP-9', amount: { currency_code: 'EUR', value: '1.00' } } }), null, 'a capture that names no order of ours');

  const headers = { 'paypal-auth-algo': 'SHA256withRSA', 'paypal-cert-url': 'https://api.paypal.com/cert', 'paypal-transmission-id': 't1', 'paypal-transmission-sig': 'sig', 'paypal-transmission-time': '2026-10-01T10:00:00Z' };
  const verify = (status: string, given = headers) => verifyPaypalEvent({ ...options, webhookId: 'WH-ID', fetch: bank([{ status: 200, body: { access_token: 'A' } }, { status: 200, body: { verification_status: status } }]).send }, given, approved);
  assert.equal(await verify('SUCCESS'), true);
  assert.equal(await verify('FAILURE'), false);
  assert.equal(await verify('SUCCESS', { ...headers, 'paypal-transmission-sig': '' }), false, 'a webhook without a signature is not asked about');
  assert.equal(await verify('SUCCESS', { ...headers, 'paypal-cert-url': 'https://paypal.com.evil.example/cert' }), false, 'nor one whose certificate is not PayPal\'s');
});

test('the stand-ins say what they are: every answer is marked simulated', async () => {
  const sim = simulatedProvider('stripe', (ref) => `http://localhost:3000/pay/sim/${ref}`);
  assert.equal(sim.id, 'stripe', 'mounted under the provider’s own name, so the river routes the same way');
  assert.deepEqual(await sim.discharge(session('stripe'), 'order_1-3'), [{ type: payFacts.providerSessionOpened, payload: { provider: 'stripe', attempt: 1, sessionRef: 'sim_stripe_order_1-3', redirectUrl: 'http://localhost:3000/pay/sim/sim_stripe_order_1-3', simulated: true } }]);
  const invoice = { amountMinor: 12_000, currency: 'EUR' as const };
  assert.deepEqual(simulatedOutcome({ provider: 'stripe', sessionRef: 's1' }, invoice, 'paid').map((d) => [d.type, d.payload.simulated]), [[payFacts.paymentCaptured, true]]);
  assert.deepEqual(simulatedOutcome({ provider: 'paypal', sessionRef: 's1' }, invoice, 'paid').map((d) => d.type), [payFacts.providerSessionApproved], 'a wallet-style provider approves first');
  assert.deepEqual(simulatedOutcome({ provider: 'stripe', sessionRef: 's1' }, invoice, 'declined').map((d) => d.type), [payFacts.paymentFailed]);
  const paypal = simulatedProvider('paypal', () => 'u');
  const capture = intention(payFacts.providerCaptureRequested, { provider: 'paypal', sessionRef: 's1', orderId: 'order_1', amountMinor: 12_000, currency: 'EUR' });
  assert.deepEqual((await paypal.discharge(capture, 'order_1-6'))[0]?.payload, { provider: 'paypal', sessionRef: 's1', providerRef: 'simcap_order_1-6', amountMinor: 12_000, currency: 'EUR', simulated: true });
  assert.equal(paypal.exhausted(capture, 'gave up'), null, 'as with the provider it stands for, an unanswered capture is never called a failure');
  assert.deepEqual(sim.exhausted(session('stripe'), 'gave up')?.map((d) => [d.type, d.payload.attempt]), [[payFacts.providerSessionFailed, 1]]);
});
