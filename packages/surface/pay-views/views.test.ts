import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashToken } from '@river/kernel';
import { payFacts } from '@river/pay-facts';
import { capturePostings } from '@river/pay-ledger';
import { createMemoryStore } from '@river/store';
import type { Fact, Origin } from '@river/stream';
import {
  ledgerSummary, orderReading, payViewPaths, readAllOrders, readMerchantOrders, readOrder, readOrderByPayKey, readOrderBySession, readPayerOrders, readPostedOrders, riverOf,
  type OrderView,
} from './gate.ts';

const merchant: Origin = { via: 'door', actor: 'm1', role: 'merchant' };
const payer: Origin = { via: 'door', actor: 'pay-key', role: 'payer' };
const figure = (by: string): Origin => ({ via: 'figure', by });
const world = (controller: string, answering: number | null = null): Origin => ({ via: 'world', controller, answering });
const payKey = 'k'.repeat(43);

// A stream written by hand: the surface is tested as a pure fold, without the figure that feeds it.
function stream(orderId = 'order_1', minute = 0) {
  const facts: Fact[] = [];
  const add = (type: string, payload: Record<string, unknown>, origin: Origin, causedBy: number | null = null) => {
    facts.push({ stream: orderId, seq: facts.length, type, payload, origin, wave: facts.length, causedBy, at: `2026-10-01T10:${String(minute + facts.length).padStart(2, '0')}:00.000Z` });
    return facts.length - 1;
  };
  const view = () => facts.reduce<OrderView | null>((v, f) => orderReading.project(v, f) as OrderView | null, null) as OrderView;
  add(payFacts.orderPlaced, { orderId, merchantId: 'm1', payerRef: 'anna.k', title: 'Ten loaves', amountMinor: 12_000, currency: 'EUR', payKeyHash: hashToken(payKey), providers: ['stripe', 'paypal'] }, merchant);
  add(payFacts.invoiceIssued, { invoiceId: `inv-${orderId}`, amountMinor: 12_000, currency: 'EUR', feeBps: 250, feeMinor: 300, netMinor: 11_700, expiresAt: '2026-10-04T10:00:00.000Z' }, figure('issueInvoice'), 0);
  return { facts, add, view };
}

function toTheGate(s: ReturnType<typeof stream>, provider = 'stripe', attempt = 1, sessionRef = 'cs_1') {
  s.add(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer);
  s.add(payFacts.providerRouted, { provider, reason: 'a rule', attempt }, figure('openGate'));
  const asked = s.add(payFacts.providerSessionRequested, { provider, attempt }, figure('openGate'));
  s.add(payFacts.providerSessionOpened, { provider, attempt, sessionRef, redirectUrl: `https://bank.example/${sessionRef}`, simulated: true }, world(provider, asked), asked);
}

function toTheMouth(s: ReturnType<typeof stream>, provider = 'stripe', sessionRef = 'cs_1') {
  s.add(payFacts.paymentCaptured, { provider, sessionRef, providerRef: 'pi_9', amountMinor: 12_000, currency: 'EUR', simulated: true }, world(provider));
  s.add(payFacts.ledgerPosted, { postings: capturePostings({ merchantId: 'm1', provider: provider as 'stripe', amountMinor: 12_000, feeMinor: 300, currency: 'EUR' }) }, figure('settleOrder'));
  s.add(payFacts.orderPaid, { provider, providerRef: 'pi_9', amountMinor: 12_000, feeMinor: 300, netMinor: 11_700, currency: 'EUR' }, figure('settleOrder'));
  s.add(payFacts.receiptIssued, { receiptId: 'rcpt-order_1', payerRef: 'anna.k', amountMinor: 12_000, currency: 'EUR' }, figure('settleOrder'));
}

test('the order view follows the line: invoiced → routing → open → paid, with the receipt and the entry', () => {
  const s = stream();
  assert.deepEqual([s.view().status, s.view().invoice?.netMinor, s.view().invoice?.expiresAt], ['invoiced', 11_700, '2026-10-04T10:00:00.000Z']);
  s.add(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer);
  assert.equal(s.view().status, 'invoiced', 'the word alone moves nothing on the surface');
  s.add(payFacts.providerRouted, { provider: 'stripe', reason: 'Stripe carries every currency of the river', attempt: 1 }, figure('openGate'));
  assert.deepEqual([s.view().status, s.view().route, s.view().attempts.attempt], ['routing', { provider: 'stripe', reason: 'Stripe carries every currency of the river' }, 1]);
  s.add(payFacts.providerSessionOpened, { provider: 'stripe', attempt: 1, sessionRef: 'cs_1', redirectUrl: 'https://bank.example/cs_1', simulated: true }, world('stripe', 4));
  assert.deepEqual([s.view().status, s.view().sessionRef, s.view().session?.redirectUrl], ['open', 'cs_1', 'https://bank.example/cs_1']);
  toTheMouth(s);
  const view = s.view();
  assert.deepEqual([view.status, view.receiptId, view.paid?.providerRef, view.paid?.simulated, view.postings.length, view.posted, view.seq], ['paid', 'rcpt-order_1', 'pi_9', true, 3, true, 8]);
  assert.equal(view.session?.openedAt, s.facts[4]?.at, 'the view remembers when the page was opened, for the clock');
  assert.equal(view.updatedAt, s.facts.at(-1)?.at);
});

test('a failure moves the view to retry once; a late report about an older session changes nothing', () => {
  const s = stream();
  toTheGate(s);
  s.add(payFacts.paymentFailed, { provider: 'stripe', sessionRef: 'cs_1', reason: 'declined' }, world('stripe'));
  assert.deepEqual([s.view().status, s.view().session, s.view().sessionRef, s.view().lastFailure?.reason], ['retry', null, null, 'declined']);
  toTheGate(s, 'paypal', 2, 'PP-2');
  s.add(payFacts.paymentFailed, { provider: 'stripe', sessionRef: 'cs_1', reason: 'expired, reported late' }, world('stripe'));
  s.add(payFacts.providerSessionFailed, { provider: 'stripe', attempt: 1, reason: 'reported late' }, world('stripe'));
  s.add(payFacts.providerSessionExpired, { provider: 'stripe', sessionRef: 'cs_1', reason: 'expired, reported late' }, world('stripe'));
  assert.deepEqual([s.view().status, s.view().sessionRef, s.view().lastFailure?.reason], ['open', 'PP-2', 'declined'], 'the session under way stays open');
  s.add(payFacts.providerSessionApproved, { provider: 'paypal', sessionRef: 'PP-2' }, world('paypal'));
  const asked = s.add(payFacts.providerCaptureRequested, { provider: 'paypal', sessionRef: 'PP-2', orderId: 'order_1', amountMinor: 12_000, currency: 'EUR' }, figure('captureApproved'));
  assert.deepEqual([s.view().status, s.view().attempts.open?.capture], ['approved', 'asked']);

  // While the capture is asked for, the surface — like the gate — is moved by its answer only.
  s.add(payFacts.providerSessionExpired, { provider: 'paypal', sessionRef: 'PP-2', reason: 'not completed in time' }, world('clock'));
  s.add(payFacts.paymentFailed, { provider: 'paypal', sessionRef: 'PP-2', reason: 'said unasked' }, world('paypal'));
  assert.equal(s.view().status, 'approved');
  s.add(payFacts.paymentPending, { provider: 'paypal', sessionRef: 'PP-2', providerRef: 'CAP-1', reason: 'PENDING_REVIEW' }, world('paypal', asked), asked);
  assert.deepEqual([s.view().status, s.view().attempts.open?.capture], ['approved', 'pending'], 'held by the provider: still being collected');
  s.add(payFacts.paymentFailed, { provider: 'paypal', sessionRef: 'PP-2', reason: 'PayPal declined the capture' }, world('paypal'));
  assert.deepEqual([s.view().status, s.view().lastFailure?.reason, s.view().session], ['retry', 'PayPal declined the capture', null]);

  const abandoned = stream();
  toTheGate(abandoned, 'paypal', 1, 'PP-1');
  abandoned.add(payFacts.providerSessionExpired, { provider: 'paypal', sessionRef: 'PP-1', reason: 'the session was not completed in time' }, world('clock'));
  assert.deepEqual([abandoned.view().status, abandoned.view().lastFailure], ['retry', { provider: 'paypal', reason: 'the session was not completed in time', at: abandoned.facts.at(-1)?.at }], 'a page nobody completed is closed, and the payer may ask again');
});

test('where the line ends: refused, cancelled, flagged — and money on a cancelled order is flagged', () => {
  const refused = stream();
  refused.add(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer);
  refused.add(payFacts.checkoutRefused, { attempt: 1, reason: 'no connected provider carries this order' }, figure('openGate'));
  assert.deepEqual([refused.view().status, refused.view().lastFailure?.provider], ['refused', null]);

  const cancelled = stream();
  toTheGate(cancelled);
  cancelled.add(payFacts.cancellationRequested, { reason: 'out of stock', unless: 'collecting' }, merchant);
  assert.equal(cancelled.view().status, 'open', 'asking is not yet withdrawing');
  cancelled.add(payFacts.orderCancelled, { reason: 'out of stock', by: 'merchant' }, figure('decideCancellation'));
  assert.deepEqual([cancelled.view().status, cancelled.view().cancelled?.by, cancelled.view().cancelled?.reason], ['cancelled', 'merchant', 'out of stock']);
  cancelled.add(payFacts.providerSessionExpired, { provider: 'stripe', sessionRef: 'cs_1', reason: 'the session expired at Stripe' }, world('stripe'));
  assert.equal(cancelled.view().status, 'cancelled', 'a withdrawn order is not asked to try again');
  cancelled.add(payFacts.paymentMismatched, { reason: 'cancelled', providerRef: 'pi_9', expectedMinor: 12_000, expectedCurrency: 'EUR', gotMinor: 12_000, gotCurrency: 'EUR' }, figure('settleOrder'));
  assert.deepEqual([cancelled.view().status, cancelled.view().flag?.reason, cancelled.view().postings, cancelled.view().posted], ['flagged', 'cancelled', [], false]);

  const twice = stream();
  toTheGate(twice);
  toTheMouth(twice);
  twice.add(payFacts.cancellationRequested, { reason: 'changed my mind', unless: 'collecting' }, merchant);
  twice.add(payFacts.cancellationRefused, { reason: 'the order is paid' }, figure('decideCancellation'));
  assert.deepEqual([twice.view().status, twice.view().cancelled], ['paid', null], 'a refused cancellation changes nothing on the surface');
  twice.add(payFacts.paymentMismatched, { reason: 'duplicate', providerRef: 'pi_second', expectedMinor: 12_000, expectedCurrency: 'EUR', gotMinor: 12_000, gotCurrency: 'EUR' }, figure('flagExtraCapture'));
  assert.deepEqual([twice.view().status, twice.view().paid?.providerRef, twice.view().postings.length], ['flagged', 'pi_9', 3], 'money arriving twice is flagged; what was settled stays settled');
  assert.equal(orderReading.project(null, twice.facts[1] as Fact), null, 'a fact with no order before it shows nothing');
});

test('the ledger summary: conservation over every posting, balances by account, totals by currency', () => {
  const eur = stream('order_1');
  toTheGate(eur);
  toTheMouth(eur);
  const usd: OrderView = { ...eur.view(), orderId: 'order_2', currency: 'USD', postings: capturePostings({ merchantId: 'm2', provider: 'paypal', amountMinor: 2_000, feeMinor: 50, currency: 'USD' }) };
  const unpaid = stream('order_3').view();
  const summary = ledgerSummary([eur.view(), usd, unpaid]);
  assert.equal(summary.balanced, true);
  assert.equal(summary.postings, 6);
  assert.deepEqual(summary.totals, [
    { currency: 'EUR', orders: 1, capturedMinor: 12_000, feesMinor: 300, payableMinor: 11_700 },
    { currency: 'USD', orders: 1, capturedMinor: 2_000, feesMinor: 50, payableMinor: 1_950 },
  ]);
  assert.deepEqual(summary.balances.map((b) => [b.account, b.currency, b.balanceMinor]), [
    ['merchant:m1:payable', 'EUR', -11_700], ['merchant:m2:payable', 'USD', -1_950], ['platform:fees', 'EUR', -300], ['platform:fees', 'USD', -50],
    ['provider:paypal:clearing', 'USD', 2_000], ['provider:stripe:clearing', 'EUR', 12_000],
  ]);
  const broken: OrderView = { ...usd, postings: usd.postings.slice(0, 2) };
  assert.equal(ledgerSummary([eur.view(), broken]).balanced, false, 'a lost line is seen');
});

test('the river of one order names who gave each fact and what kind of step it is', () => {
  const s = stream();
  toTheGate(s);
  s.add(payFacts.paymentCaptured, { provider: 'stripe', sessionRef: 'cs_1', providerRef: 'pi_9', amountMinor: 12_000, currency: 'EUR', simulated: true }, world('stripe'));
  const rows = riverOf(s.facts);
  assert.deepEqual(rows.map((r) => [r.seq, r.kind, r.who]), [
    [0, 'gesture', 'merchant m1'], [1, 'figure', 'issueInvoice'], [2, 'gesture', 'payer pay-key'], [3, 'figure', 'openGate'],
    [4, 'intention', 'openGate'], [5, 'answer', 'stripe'], [6, 'report', 'stripe'],
  ]);
  assert.deepEqual([rows[5]?.answering, rows[5]?.causedBy], [4, 4]);
  assert.equal(rows[0]?.payload.payKeyHash, `${hashToken(payKey).slice(0, 8)}…`, 'the key\'s hash is shown as a fingerprint');
  assert.equal(s.facts[0]?.payload.payKeyHash, hashToken(payKey), 'and the stream itself is not touched');
});

test('the cabinets read: by pay key, by open session, by merchant, by payer, and all', async () => {
  const store = createMemoryStore();
  const root = 'orgs/test';
  const first = stream('order_1', 0);
  toTheGate(first);
  const second = stream('order_2', 20);
  const other: OrderView = { ...second.view(), merchantId: 'm2', payerRef: 'cafe', payKeyHash: hashToken('z'.repeat(43)) };
  await store.transact(async (tx) => {
    tx.set(payViewPaths.order(root, 'order_1'), first.view());
    tx.set(payViewPaths.order(root, 'order_2'), other);
  });
  assert.equal((await readOrder(store, root, 'order_1'))?.title, 'Ten loaves');
  assert.equal(await readOrder(store, root, 'order_9'), null);
  assert.equal((await readOrderByPayKey(store, root, payKey))?.orderId, 'order_1');
  assert.equal(await readOrderByPayKey(store, root, 'x'.repeat(43)), null);
  assert.equal(await readOrderByPayKey(store, root, 'short'), null);
  assert.equal(await readOrderByPayKey(store, root, '../../etc'), null);
  assert.equal((await readOrderBySession(store, root, 'cs_1'))?.orderId, 'order_1');
  assert.equal(await readOrderBySession(store, root, 'cs_0'), null);
  assert.deepEqual((await readMerchantOrders(store, root, 'm1')).map((o) => o.orderId), ['order_1']);
  assert.deepEqual((await readPayerOrders(store, root, 'cafe')).map((o) => o.orderId), ['order_2']);
  assert.deepEqual((await readAllOrders(store, root)).map((o) => o.orderId), ['order_2', 'order_1'], 'newest first');
  assert.deepEqual(await readPostedOrders(store, root), [], 'nothing is in the ledger yet');
  const paid = stream('order_3', 40);
  toTheGate(paid);
  toTheMouth(paid);
  await store.transact(async (tx) => tx.set(payViewPaths.order(root, 'order_3'), paid.view()));
  assert.deepEqual((await readPostedOrders(store, root)).map((o) => o.orderId), ['order_3']);
  assert.deepEqual((await readAllOrders(store, root, 2)).map((o) => o.orderId), ['order_3', 'order_2'], 'the list may be cut short; the ledger never is');
  assert.equal('id' in ((await readOrder(store, root, 'order_1')) as object), false);
});
