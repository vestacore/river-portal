import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runWave, type Assembly, type FigureState } from '@river/figure';
import { payFacts, type OrderPlaced, type Posting } from '@river/pay-facts';
import { isBalanced } from '@river/pay-ledger';
import type { Fact, Origin, StreamHead } from '@river/stream';
import { chooseProvider, defaultRouting, payFigure, type GateState, type PaySettings } from './gate.ts';

const settings: PaySettings = { feeBps: 250, invoiceTtlHours: 72, routing: defaultRouting, mounted: ['stripe', 'paypal'] };
const order: OrderPlaced = { orderId: 'order_1', merchantId: 'm1', payerRef: 'payer-a', title: 'Ten loaves', amountMinor: 12_000, currency: 'EUR', payKeyHash: 'hash', providers: ['stripe', 'paypal'] };
const merchant: Origin = { via: 'door', actor: 'm1', role: 'merchant' };
const payer: Origin = { via: 'door', actor: 'payer-a', role: 'payer' };
const world = (controller: string, answering: number | null = null): Origin => ({ via: 'world', controller, answering });
const clock = world('clock');
const withdraw = { reason: 'out of stock', unless: 'collecting' };

// The figure alone, with no store and no bank: every wave is a pure function of the facts before it.
function river(placed: OrderPlaced = order, mounted: PaySettings['mounted'] = settings.mounted) {
  const assembly: Assembly = { ...payFigure({ ...settings, mounted }), controllers: [], readings: [] };
  let state: FigureState = { upToSeq: -1, listeners: {}, fired: {} };
  let head: StreamHead = { stream: placed.orderId, nextSeq: 0, waves: 0, updatedAt: null };
  const all: Fact[] = [];
  const enter = (type: string, payload: Record<string, unknown>, origin: Origin): string[] => {
    const wave = runWave(assembly, state, head, [{ draft: { type, payload }, origin, causedBy: null }], '2026-10-01T10:00:00.000Z');
    state = wave.state;
    head = { ...head, nextSeq: head.nextSeq + wave.facts.length, waves: head.waves + 1 };
    all.push(...wave.facts);
    return wave.facts.map((f) => f.type);
  };
  const last = (type: string) => all.filter((f) => f.type === type).pop()?.payload;
  const seqOf = (type: string) => all.filter((f) => f.type === type).pop()?.seq ?? -1;
  const gate = () => state.listeners.checkoutGate as unknown as GateState;
  enter(payFacts.orderPlaced, placed, merchant);
  return { enter, all, last, seqOf, gate };
}

const opened = (provider: string, attempt: number, sessionRef: string) => ({ provider, attempt, sessionRef, redirectUrl: `https://bank.example/${sessionRef}`, simulated: true });
const captured = (provider: string, sessionRef: string, amountMinor = 12_000, currency = 'EUR') => ({ provider, sessionRef, providerRef: `pay_${sessionRef}`, amountMinor, currency, simulated: true });

test('an order becomes an invoice with the commission stated before anyone pays', () => {
  const r = river();
  assert.deepEqual(r.all.map((f) => [f.type, f.origin.via]), [[payFacts.orderPlaced, 'door'], [payFacts.invoiceIssued, 'figure']]);
  assert.deepEqual(r.last(payFacts.invoiceIssued), { invoiceId: 'inv-order_1', amountMinor: 12_000, currency: 'EUR', feeBps: 250, feeMinor: 300, netMinor: 11_700, expiresAt: '2026-10-04T10:00:00.000Z' });
});

test('the payer opens the gate: one route, one intention; asking again while a session is open changes nothing', () => {
  const r = river();
  assert.deepEqual(r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer), [payFacts.checkoutRequested, payFacts.providerRouted, payFacts.providerSessionRequested]);
  assert.deepEqual(r.last(payFacts.providerRouted), { provider: 'stripe', reason: 'Stripe carries every currency of the river', attempt: 1 });
  assert.equal(r.last(payFacts.providerSessionRequested)?.feeMinor, 300, 'the provider is told the fee, so it can split the payment');
  assert.deepEqual(r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer), [payFacts.checkoutRequested], 'no second session beside an open one');
});

test('the mouth: a matching capture settles once — a balanced entry, the order paid, a receipt', () => {
  const r = river();
  r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer);
  r.enter(payFacts.providerSessionOpened, opened('stripe', 1, 'cs_1'), world('stripe'));
  assert.deepEqual(r.enter(payFacts.paymentCaptured, captured('stripe', 'cs_1'), world('stripe')), [payFacts.paymentCaptured, payFacts.ledgerPosted, payFacts.orderPaid, payFacts.receiptIssued]);
  const postings = r.last(payFacts.ledgerPosted)?.postings as Posting[];
  assert.equal(isBalanced(postings), true);
  assert.deepEqual(postings.map((p) => [p.account, p.side, p.amountMinor]), [['provider:stripe:clearing', 'debit', 12_000], ['merchant:m1:payable', 'credit', 11_700], ['platform:fees', 'credit', 300]]);
  assert.deepEqual(r.last(payFacts.orderPaid), { provider: 'stripe', providerRef: 'pay_cs_1', amountMinor: 12_000, feeMinor: 300, netMinor: 11_700, currency: 'EUR' });
  assert.deepEqual(r.enter(payFacts.paymentCaptured, captured('stripe', 'cs_1'), world('stripe')), [payFacts.paymentCaptured], 'the mouth is crossed once, whatever arrives after');
  assert.deepEqual(r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer), [payFacts.checkoutRequested], 'a paid order opens no gate');
});

test('a failed crossing is tried again by another bank, when the payer asks', () => {
  const r = river();
  r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer);
  assert.deepEqual(r.enter(payFacts.providerSessionFailed, { provider: 'stripe', attempt: 1, reason: 'card network down' }, world('stripe')), [payFacts.providerSessionFailed], 'the failure alone opens nothing');
  assert.deepEqual(r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer), [payFacts.checkoutRequested, payFacts.providerRouted, payFacts.providerSessionRequested]);
  assert.deepEqual(r.last(payFacts.providerRouted), { provider: 'paypal', reason: 'PayPal carries EUR, USD and GBP (after Stripe failed)', attempt: 2 });
  assert.deepEqual([r.gate().attempt, r.gate().open, r.gate().failed], [2, { provider: 'paypal', sessionRef: null, capture: 'none' }, ['stripe']]);
});

test('a failure closes the attempt it names, once: repeated and late reports change nothing', () => {
  const r = river();
  r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer);
  r.enter(payFacts.providerSessionOpened, opened('stripe', 1, 'cs_1'), world('stripe'));
  r.enter(payFacts.paymentFailed, { provider: 'stripe', sessionRef: 'cs_1', reason: 'declined' }, world('stripe'));
  r.enter(payFacts.paymentFailed, { provider: 'stripe', sessionRef: 'cs_1', reason: 'expired' }, world('stripe'));
  assert.deepEqual([r.gate().attempt, r.gate().open, r.gate().failed], [1, null, ['stripe']], 'the second report of the same failure is heard and changes nothing');
  assert.deepEqual(r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer), [payFacts.checkoutRequested, payFacts.providerRouted, payFacts.providerSessionRequested]);
  r.enter(payFacts.providerSessionOpened, opened('paypal', 2, 'PP-2'), world('paypal'));
  r.enter(payFacts.paymentFailed, { provider: 'stripe', sessionRef: 'cs_1', reason: 'expired, reported late' }, world('stripe'));
  r.enter(payFacts.providerSessionFailed, { provider: 'stripe', attempt: 1, reason: 'reported late' }, world('stripe'));
  r.enter(payFacts.providerSessionExpired, { provider: 'stripe', sessionRef: 'cs_1', reason: 'expired, reported late' }, world('stripe'));
  assert.deepEqual([r.gate().attempt, r.gate().open, r.gate().failed], [2, { provider: 'paypal', sessionRef: 'PP-2', capture: 'none' }, ['stripe']], 'a late report about an older session does not close the one under way');
  assert.deepEqual(r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer), [payFacts.checkoutRequested], 'and the payer cannot open a second session beside it');
});

test('money the invoice does not explain is flagged and nothing is settled', () => {
  const cases: Array<[string, Record<string, unknown>, string]> = [
    ['amount', captured('stripe', 'cs_1', 11_999), 'amount'],
    ['currency', captured('stripe', 'cs_1', 12_000, 'USD'), 'currency'],
    ['session', captured('stripe', 'cs_unknown'), 'session'],
  ];
  for (const [name, capture, reason] of cases) {
    const r = river();
    r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer);
    r.enter(payFacts.providerSessionOpened, opened('stripe', 1, 'cs_1'), world('stripe'));
    assert.deepEqual(r.enter(payFacts.paymentCaptured, capture, world('stripe')), [payFacts.paymentCaptured, payFacts.paymentMismatched], name);
    assert.equal(r.last(payFacts.paymentMismatched)?.reason, reason);
    assert.equal(r.all.some((f) => f.type === payFacts.ledgerPosted || f.type === payFacts.orderPaid), false);
    assert.deepEqual(r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer), [payFacts.checkoutRequested], 'a flagged order opens no gate');
  }
});

test('a withdrawn order: the gate stays shut, and a late capture is flagged, never settled', () => {
  const r = river();
  r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer);
  r.enter(payFacts.providerSessionOpened, opened('stripe', 1, 'cs_1'), world('stripe'));
  assert.deepEqual(r.enter(payFacts.cancellationRequested, withdraw, merchant), [payFacts.cancellationRequested, payFacts.orderCancelled], 'asked at the door, decided by the figure');
  assert.deepEqual(r.last(payFacts.orderCancelled), { reason: 'out of stock', by: 'merchant' });
  assert.deepEqual(r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer), [payFacts.checkoutRequested]);
  assert.deepEqual(r.enter(payFacts.paymentCaptured, captured('stripe', 'cs_1'), world('stripe')), [payFacts.paymentCaptured, payFacts.paymentMismatched]);
  assert.equal(r.last(payFacts.paymentMismatched)?.reason, 'cancelled');
  assert.deepEqual(r.enter(payFacts.cancellationRequested, withdraw, merchant), [payFacts.cancellationRequested, payFacts.cancellationRefused]);
  assert.equal(r.last(payFacts.cancellationRefused)?.reason, 'the order is already withdrawn');
});

test('a cancellation is decided inside the wave: never while money is being collected, and the clock never under a payer', () => {
  const small: OrderPlaced = { ...order, orderId: 'order_2', amountMinor: 2_000, currency: 'USD' };
  const r = river(small);
  r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_2' }, payer);
  r.enter(payFacts.providerSessionOpened, opened('paypal', 1, 'PP-1'), world('paypal'));
  assert.deepEqual(r.enter(payFacts.cancellationRequested, { reason: 'the invoice expired', unless: 'underWay' }, clock), [payFacts.cancellationRequested, payFacts.cancellationRefused], 'an invoice does not expire under a payer who is paying it');
  assert.equal(r.last(payFacts.cancellationRefused)?.reason, 'an attempt is under way');

  r.enter(payFacts.providerSessionApproved, { provider: 'paypal', sessionRef: 'PP-1' }, world('paypal'));
  assert.equal(r.gate().open?.capture, 'asked');
  assert.deepEqual(r.enter(payFacts.cancellationRequested, withdraw, merchant), [payFacts.cancellationRequested, payFacts.cancellationRefused], 'the capture is on its way: the order cannot be withdrawn under it');
  assert.equal(r.last(payFacts.cancellationRefused)?.reason, 'a payment is being collected');

  r.enter(payFacts.paymentCaptured, captured('paypal', 'PP-1', 2_000, 'USD'), world('paypal', r.seqOf(payFacts.providerCaptureRequested)));
  assert.equal(r.all.some((f) => f.type === payFacts.orderPaid), true);
  assert.deepEqual(r.enter(payFacts.cancellationRequested, withdraw, merchant), [payFacts.cancellationRequested, payFacts.cancellationRefused]);
  assert.equal(r.last(payFacts.cancellationRefused)?.reason, 'the order is paid');
  assert.equal(r.all.some((f) => f.type === payFacts.orderCancelled || f.type === payFacts.paymentMismatched), false, 'paid, never withdrawn, nothing flagged');

  const waiting = river();
  assert.deepEqual(waiting.enter(payFacts.cancellationRequested, { reason: 'the invoice expired', unless: 'underWay' }, clock), [payFacts.cancellationRequested, payFacts.orderCancelled]);
  assert.deepEqual(waiting.last(payFacts.orderCancelled), { reason: 'the invoice expired', by: 'clock' });
});

test('while a capture is asked for, only its own answer ends the attempt; once the provider holds it pending, the provider may', () => {
  const small: OrderPlaced = { ...order, orderId: 'order_2', amountMinor: 2_000, currency: 'USD' };
  const r = river(small);
  r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_2' }, payer);
  r.enter(payFacts.providerSessionOpened, opened('paypal', 1, 'PP-1'), world('paypal'));
  r.enter(payFacts.providerSessionApproved, { provider: 'paypal', sessionRef: 'PP-1' }, world('paypal'));
  const asked = r.seqOf(payFacts.providerCaptureRequested);

  r.enter(payFacts.providerSessionExpired, { provider: 'paypal', sessionRef: 'PP-1', reason: 'not completed in time' }, clock);
  r.enter(payFacts.paymentFailed, { provider: 'paypal', sessionRef: 'PP-1', reason: 'said by a webhook, unasked' }, world('paypal'));
  assert.deepEqual([r.gate().open?.capture, r.gate().failed], ['asked', []], 'neither an expiry nor an unasked failure sends the payer to pay again');
  assert.deepEqual(r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_2' }, payer), [payFacts.checkoutRequested]);

  r.enter(payFacts.paymentPending, { provider: 'paypal', sessionRef: 'PP-1', providerRef: 'CAP-1', reason: 'PENDING_REVIEW' }, world('paypal', asked));
  assert.equal(r.gate().open?.capture, 'pending', 'the provider holds the capture; the attempt stays open');
  assert.equal(r.all.some((f) => f.type === payFacts.orderPaid || f.type === payFacts.ledgerPosted), false, 'pending is not money');
  assert.deepEqual(r.enter(payFacts.paymentCaptured, captured('paypal', 'PP-1', 2_000, 'USD'), world('paypal')), [payFacts.paymentCaptured, payFacts.ledgerPosted, payFacts.orderPaid, payFacts.receiptIssued], 'the provider reports the outcome itself');

  const declined = river(small);
  declined.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_2' }, payer);
  declined.enter(payFacts.providerSessionOpened, opened('paypal', 1, 'PP-1'), world('paypal'));
  declined.enter(payFacts.providerSessionApproved, { provider: 'paypal', sessionRef: 'PP-1' }, world('paypal'));
  declined.enter(payFacts.paymentFailed, { provider: 'paypal', sessionRef: 'PP-1', reason: 'INSTRUMENT_DECLINED' }, world('paypal', declined.seqOf(payFacts.providerCaptureRequested)));
  assert.deepEqual([declined.gate().open, declined.gate().failed], [null, ['paypal']], 'the capture\'s own answer ends the attempt');
});

test('a session nobody completed is closed by an expiry, and the payer may ask again', () => {
  const small: OrderPlaced = { ...order, orderId: 'order_2', amountMinor: 2_000, currency: 'USD', providers: ['paypal'] };
  const r = river(small);
  r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_2' }, payer);
  r.enter(payFacts.providerSessionOpened, opened('paypal', 1, 'PP-1'), world('paypal'));
  r.enter(payFacts.providerSessionExpired, { provider: 'paypal', sessionRef: 'PP-1', reason: 'the session was not completed in time' }, clock);
  assert.deepEqual([r.gate().open, r.gate().failed], [null, ['paypal']]);
  assert.deepEqual(r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_2' }, payer), [payFacts.checkoutRequested, payFacts.providerRouted, payFacts.providerSessionRequested]);
  r.enter(payFacts.providerSessionOpened, opened('paypal', 2, 'PP-2'), world('paypal'));

  // The payer then approves the older session after all: the money is collected and the order is paid once.
  assert.deepEqual(r.enter(payFacts.providerSessionApproved, { provider: 'paypal', sessionRef: 'PP-1' }, world('paypal')), [payFacts.providerSessionApproved, payFacts.providerCaptureRequested]);
  assert.deepEqual(r.enter(payFacts.paymentCaptured, captured('paypal', 'PP-1', 2_000, 'USD'), world('paypal', r.seqOf(payFacts.providerCaptureRequested))), [payFacts.paymentCaptured, payFacts.ledgerPosted, payFacts.orderPaid, payFacts.receiptIssued]);
  assert.deepEqual(r.enter(payFacts.providerSessionApproved, { provider: 'paypal', sessionRef: 'PP-2' }, world('paypal')), [payFacts.providerSessionApproved], 'an approval after payment collects nothing');
});

test('money arriving twice: the same capture told again is the same money; another capture is flagged', () => {
  const r = river();
  r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_1' }, payer);
  r.enter(payFacts.providerSessionOpened, opened('stripe', 1, 'cs_1'), world('stripe'));
  r.enter(payFacts.paymentCaptured, captured('stripe', 'cs_1'), world('stripe'));
  assert.deepEqual(r.enter(payFacts.paymentCaptured, captured('stripe', 'cs_1'), world('stripe')), [payFacts.paymentCaptured], 'told twice, counted once');
  assert.deepEqual(r.enter(payFacts.paymentCaptured, { ...captured('stripe', 'cs_1'), providerRef: 'pi_second' }, world('stripe')), [payFacts.paymentCaptured, payFacts.paymentMismatched]);
  assert.deepEqual(r.last(payFacts.paymentMismatched), { reason: 'duplicate', providerRef: 'pi_second', expectedMinor: 12_000, expectedCurrency: 'EUR', gotMinor: 12_000, gotCurrency: 'EUR' });
  assert.deepEqual(r.enter(payFacts.paymentCaptured, { ...captured('stripe', 'cs_1'), providerRef: 'pi_second' }, world('stripe')), [payFacts.paymentCaptured], 'flagged once for each');
  assert.equal(r.all.filter((f) => f.type === payFacts.ledgerPosted).length, 1, 'and posted once');
});


test('a provider that waits to be asked: approval, then one capture request for that session', () => {
  const small: OrderPlaced = { ...order, orderId: 'order_2', amountMinor: 2_000, currency: 'USD' };
  const r = river(small);
  r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_2' }, payer);
  assert.equal(r.last(payFacts.providerRouted)?.provider, 'paypal', 'small USD payments go to PayPal');
  r.enter(payFacts.providerSessionOpened, opened('paypal', 1, 'PP-1'), world('paypal'));
  assert.deepEqual(r.enter(payFacts.providerSessionApproved, { provider: 'paypal', sessionRef: 'PP-1' }, world('paypal')), [payFacts.providerSessionApproved, payFacts.providerCaptureRequested]);
  assert.deepEqual(r.enter(payFacts.providerSessionApproved, { provider: 'paypal', sessionRef: 'PP-1' }, world('paypal')), [payFacts.providerSessionApproved], 'the same approval asks once');
  assert.deepEqual(r.enter(payFacts.paymentCaptured, captured('paypal', 'PP-1', 2_000, 'USD'), world('paypal')), [payFacts.paymentCaptured, payFacts.ledgerPosted, payFacts.orderPaid, payFacts.receiptIssued]);
});

test('routing is a pure rule: the first that fits, among the connected; refused when nothing carries the order', () => {
  assert.deepEqual(chooseProvider({ amountMinor: 4_000, currency: 'GBP', providers: ['stripe', 'paypal'] }, defaultRouting, []), { provider: 'paypal', reason: 'small USD and GBP payments go to PayPal' });
  assert.equal(chooseProvider({ amountMinor: 4_000, currency: 'GBP', providers: ['stripe'] }, defaultRouting, [])?.provider, 'stripe');
  assert.equal(chooseProvider({ amountMinor: 900, currency: 'UAH', providers: ['stripe'] }, defaultRouting, ['stripe'])?.reason, 'Stripe carries every currency of the river (no other provider is connected; trying again)');
  assert.equal(chooseProvider({ amountMinor: 900, currency: 'UAH', providers: ['paypal'] }, defaultRouting, []), null);

  const r = river({ ...order, orderId: 'order_3', currency: 'UAH', providers: ['paypal'] });
  assert.deepEqual(r.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_3' }, payer), [payFacts.checkoutRequested, payFacts.checkoutRefused]);
  assert.deepEqual([r.gate().attempt, r.gate().open, r.gate().asked], [1, null, false], 'a refusal is an attempt that is over, and the payer\'s word is spent');

  const unmounted = river({ ...order, orderId: 'order_4' }, ['paypal']);
  unmounted.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_4' }, payer);
  assert.equal(unmounted.last(payFacts.providerRouted)?.provider, 'paypal', 'a provider this deployment has not mounted is not routed to, though the merchant connected it');
  const none = river({ ...order, orderId: 'order_5' }, []);
  assert.deepEqual(none.enter(payFacts.checkoutRequested, { invoiceId: 'inv-order_5' }, payer), [payFacts.checkoutRequested, payFacts.checkoutRefused]);
  assert.equal(none.last(payFacts.checkoutRefused)?.reason, 'no routing rule lets a connected provider (none) carry this order');
});
