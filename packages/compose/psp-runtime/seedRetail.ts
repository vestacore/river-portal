import { acquiringCostOf } from '@river/psp-contracts';
import type { InstrumentDetail, InstrumentId, OrderLine, SettlementLine } from '@river/psp-facts';
import type { ApiLogEntry } from '@river/psp-integration';
import { issuers } from '@river/psp-instruments';
import { isSessionClosed } from '@river/psp-session';
import { policyValue } from '@river/psp-units';
import { acquiringTermsFor } from './acquiringTermsFor.ts';
import { appendFacts } from './appendFacts.ts';
import { bonusBalanceOf } from './bonusBalanceOf.ts';
import { createQueue } from './createQueue.ts';
import { createRng } from './createRng.ts';
import { creditSettlements } from './creditSettlements.ts';
import { corporateProducts, groceryProducts, type GroceryProduct } from './data/retailCatalogue.ts';
import { productMix, regionIssuerMix, retailStores } from './data/retailStores.ts';
import { decideInsight } from './decideInsight.ts';
import { decideReview } from './decideReview.ts';
import { driveSession } from './driveSession.ts';
import { effectiveFor } from './effectiveFor.ts';
import { expireInvoices } from './expireInvoices.ts';
import { expireSessions } from './expireSessions.ts';
import { markFulfilment } from './markFulfilment.ts';
import { payerGesture } from './payerGesture.ts';
import { placeOrder } from './placeOrder.ts';
import { recordPicking } from './recordPicking.ts';
import { refreshSwarm } from './refreshSwarm.ts';
import { refundPayment } from './refundPayment.ts';
import { remindInvoice } from './remindInvoice.ts';
import { requestCapture } from './requestCapture.ts';
import { runPayouts } from './runPayouts.ts';
import { startSession } from './startSession.ts';
import { submitInstrument } from './submitInstrument.ts';
import type { Actor, Scenario, Waiting, World } from './types/World.ts';
import { voidHold } from './voidHold.ts';

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

const person = (personId: string, grantId: string, role: Extract<Actor, { kind: 'person' }>['role'], unitId: string): Actor => ({ kind: 'person', personId, grantId, role, unitId });
const serhii = person('r-serhii', 'gr-r-serhii-ops', 'operator', 'rt-online');
const anna = person('r-anna', 'gr-r-anna-risk', 'compliance_officer', 'rt-group');
const mykola = person('r-mykola', 'gr-r-mykola-pay', 'payments_manager', 'rt-group');
const natalia = person('r-natalia', 'gr-r-natalia-fin', 'finance_controller', 'rt-group');
const yurii = person('r-yurii', 'gr-r-yurii-int', 'integrator', 'rt-group');
const oms = { via: 'door' as const, actor: 'api:oms', role: 'integrator' };
const omsWorld = { via: 'world' as const, controller: 'oms', answering: null };
const onlineIssuers: Record<string, number> = { 'bank-dnipro': 35, 'bank-stepove': 21, 'bank-karpaty': 13, 'bank-polissia': 14, 'bank-misto': 13, foreign: 4 };
const foreignBins = ['476134', '406655', '531421', '545454'];

/**
 * The retail stand's history, replayed through the same functions a live payment uses. Online orders of
 * the web shop and the app are authorised, picked — weighed goods, missing items, substitutes — and
 * captured for the picked total by the order system; some are part-paid with bonus points; deliveries are
 * paid at the door by QR; companies pay invoices by transfer. Every bank settles to the group's accounts
 * and reports its batches; the stores' card sales, which the platform does not process, arrive as the
 * tills' daily records and the terminal banks' reports; the bank statement credits them. A few stories
 * give the agents and the cabinets something to find.
 */
export function seedRetail(world: World, now: string, days = 75): void {
  const rng = createRng(20_261_020);
  const end = Date.parse(now);
  const start = Date.parse(`${new Date(end - days * day).toISOString().slice(0, 10)}T00:00:00.000Z`);
  const queue = createQueue();
  const iso = (t: number) => new Date(Math.min(t, end - minute)).toISOString();
  const at = (t: number, run: () => void) => { if (t < end) queue.push(t, run); };
  const ymd = (t: number) => new Date(t).toISOString().slice(0, 10);
  const balance = (payerRef: string) => bonusBalanceOf(world, payerRef);

  // A card of a bank, as the payer's browser describes it: the brand, a BIN in the bank's range, the last four.
  const cardOf = (issuerId: string): InstrumentDetail => {
    const last4 = String(rng.int(0, 9_999)).padStart(4, '0');
    if (issuerId === 'foreign') { const bin = rng.pick(foreignBins); return { brand: bin.startsWith('5') ? 'mastercard' : 'visa', bin, last4, issuerCountry: rng.pick(['PL', 'DE', 'GB', 'US', 'MD']) }; }
    const issuer = issuers.find((i) => i.id === issuerId)!;
    const product = rng.weighted(productMix);
    const prostir = product === 'debit' && rng.chance(0.06) ? issuer.bins.find((b) => b.scheme === 'prostir') : undefined;
    const range = prostir ?? issuer.bins.find((b) => b.product === product) ?? issuer.bins.find((b) => b.product === 'debit')!;
    const bin = (range.prefix + String(rng.int(0, 99_999)).padStart(5, '0')).slice(0, 6);
    return { brand: range.scheme === 'prostir' ? 'prostir' : range.scheme === 'mastercard' ? 'mastercard' : 'visa', bin, last4, issuerCountry: 'UA' };
  };
  const scenarioFor = (instrument: InstrumentId): Omit<Scenario, 'challenge'> & { issuerWantsChallenge: boolean } => ({
    issuer: 'by_acquirer', issuerWantsChallenge: instrument === 'card' && rng.chance(0.25), challengePass: rng.chance(0.96), device: rng.chance(0.985),
    consent: rng.chance(0.95), credit: rng.chance(0.84), pushed: false,
  });
  const linesOf = (products: readonly GroceryProduct[], count: number, quantity: () => number): OrderLine[] => {
    const chosen = new Set<number>();
    while (chosen.size < Math.min(count, products.length)) chosen.add(rng.int(0, products.length - 1));
    return [...chosen].map((i) => {
      const product = products[i]!;
      const unitMinor = Math.round(rng.int(product.minMinor, product.maxMinor) / 10) * 10;
      const q = product.weighed ? 1 : quantity();
      return { sku: product.sku, title: product.title, quantity: q, unitMinor, totalMinor: unitMinor * q, sellerUnitId: null };
    });
  };
  const logCall = (t: number, method: ApiLogEntry['method'], path: string, status: number, keyId: string, summary: string, idempotencyKey: string | null = null) => {
    if (world.quiet) return;
    const n = (world.counters.api ?? 0) + 1;
    world.counters.api = n;
    world.apiLog.push({ id: `req_${n.toString(36).toUpperCase().padStart(6, '0')}`, at: iso(t), unitId: keyId === 'key-r-erp' ? 'rt-group' : 'rt-online', keyId, mode: 'live', method, path, status, durationMs: rng.int(12, 160), idempotencyKey, summary });
    const key = world.keys.find((k) => k.id === keyId);
    if (key) key.lastUsedAt = iso(t);
  };

  // After an attempt moves: the payer's next gesture, the world's answer, or the order's life after payment.
  const follow = (sessionId: string, waiting: Waiting | { error: string }, t: number, attempt: number, afterPaid: (t: number) => void) => {
    if (typeof waiting !== 'string') return;
    const session = world.views.sessions.get(sessionId);
    if (!session) return;
    const scenario = world.scenarios.get(sessionId);
    const again = (w: Waiting | { error: string }, t2: number) => follow(sessionId, w, t2, attempt, afterPaid);
    switch (waiting) {
      case 'challenge': { const t2 = t + rng.int(30, 110) * 1_000; at(t2, () => again(payerGesture(world, sessionId, { kind: 'challenge', pass: scenario?.challengePass ?? true }, iso(t2)), t2)); break; }
      case 'device': { const t2 = t + rng.int(5, 20) * 1_000; if (scenario?.device) at(t2, () => again(payerGesture(world, sessionId, { kind: 'device' }, iso(t2)), t2)); break; }
      case 'consent': { const t2 = t + rng.int(1, 4) * minute; at(t2, () => again(payerGesture(world, sessionId, { kind: 'consent', approve: scenario?.consent ?? true }, iso(t2)), t2)); break; }
      case 'funds': { const t2 = t + (session.instrument === 'bank_transfer' ? rng.int(3, 40) * hour : rng.int(1, 4) * minute); if (rng.chance(0.96)) at(t2, () => again(payerGesture(world, sessionId, { kind: 'funds' }, iso(t2)), t2)); break; }
      case 'review': {
        const t2 = t + rng.int(15, 150) * minute;
        at(t2, () => {
          decideReview(world, anna, sessionId, rng.chance(0.85), rng.chance(0.5) ? 'Checked with the customer' : '', iso(t2));
          const s = world.views.sessions.get(sessionId);
          if (s && !isSessionClosed(s)) follow(sessionId, driveSession(world, sessionId, iso(t2)), t2, attempt, afterPaid);
          else if (s?.outcome === 'succeeded') afterPaid(t2);
        });
        break;
      }
      case 'capture': afterPaid(t); break;
      case 'done': afterPaid(t); break;
      case 'failed': break;
    }
  };

  // One attempt to pay (all of) an invoice with an instrument the payer picks.
  const pay = (invoiceId: string, instrument: InstrumentId, t: number, afterPaid: (t: number) => void, opts: { issuer?: string; amountMinor?: number; attempt?: number; onFailed?: (t: number) => void } = {}) => {
    const invoice = world.views.invoices.get(invoiceId);
    const order = invoice ? world.views.orders.get(invoice.orderId) : undefined;
    if (!invoice || !order) return;
    const opened = startSession(world, invoiceId, { channel: order.channel, locale: rng.chance(0.82) ? 'uk' : 'en-GB', country: 'UA', payerHandle: order.payerRef, ...(opts.amountMinor ? { amountMinor: opts.amountMinor } : {}) }, iso(t));
    if ('error' in opened) return;
    const card = instrument === 'card' || instrument === 'apple_pay' || instrument === 'google_pay';
    const detail: InstrumentDetail = card ? { ...cardOf(opts.issuer ?? rng.weighted(onlineIssuers)), ...(instrument !== 'card' ? { wallet: instrument } : {}) } : instrument === 'installments' ? { parts: rng.pick([3, 4, 6]), bank: 'Chastyny Credit' } : instrument === 'bonus_points' ? { wallet: 'Yarmarok bonus' } : { bank: rng.pick(['Bank Dnipro (demo)', 'Polissia Bank (demo)', 'Misto Bank (demo)']) };
    const scenario = instrument === 'bonus_points' ? { issuer: 'approve' as const, consent: true, issuerWantsChallenge: false } : scenarioFor(instrument);
    const t2 = t + rng.int(20, 90) * 1_000;
    const attempt = opts.attempt ?? 1;
    at(t2, () => {
      const waiting = submitInstrument(world, opened.sessionId, instrument, detail, scenario, iso(t2));
      follow(opened.sessionId, waiting, t2, attempt, afterPaid);
      const s = world.views.sessions.get(opened.sessionId);
      if (s?.outcome === 'failed' && attempt < 3 && card && rng.chance(0.6)) { const t3 = t2 + rng.int(1, 6) * minute; at(t3, () => pay(invoiceId, rng.pick(['card', 'apple_pay', 'google_pay'] as const), t3, afterPaid, { attempt: attempt + 1, ...(opts.onFailed ? { onFailed: opts.onFailed } : {}) })); }
      else if (s?.outcome === 'failed' && opts.onFailed) opts.onFailed(t2);
    });
  };

  // An online order is picked within hours: weighed goods weigh what they weigh, some items are missing,
  // some substituted. The order system captures the picked total (less the bonus points already taken);
  // the rest of the hold is released. Then the courier delivers.
  const pickAndCapture = (orderId: string, t: number) => {
    const order = world.views.orders.get(orderId);
    if (!order || order.picked) return;
    const changes: Array<{ sku: string; kind: 'weight' | 'missing' | 'substitute'; deltaMinor: number }> = [];
    const lines: OrderLine[] = [];
    for (const line of order.lines) {
      const product = groceryProducts.find((p) => p.sku === line.sku);
      if (rng.chance(0.05)) { changes.push({ sku: line.sku, kind: 'missing', deltaMinor: -line.totalMinor }); continue; }
      if (product?.weighed) {
        // Weighed goods are picked up to the weight ordered: the payer is never charged above the estimate.
        const total = Math.round((line.totalMinor * rng.int(900, 1_000)) / 1_000);
        if (total !== line.totalMinor) changes.push({ sku: line.sku, kind: 'weight', deltaMinor: total - line.totalMinor });
        lines.push({ ...line, unitMinor: total, totalMinor: total });
      } else if (rng.chance(0.03)) {
        const unitMinor = Math.round((line.unitMinor * rng.int(88, 100)) / 1_000) * 10;
        changes.push({ sku: line.sku, kind: 'substitute', deltaMinor: unitMinor * line.quantity - line.totalMinor });
        lines.push({ ...line, unitMinor, totalMinor: unitMinor * line.quantity });
      } else lines.push(line);
    }
    if (lines.length === 0) lines.push(order.lines[0]!);
    const picked = recordPicking(world, orderId, { lines, changes }, omsWorld, iso(t));
    if ('error' in picked) return;
    const payments = order.paymentIds.map((id) => world.views.payments.get(id)).filter((p) => p !== undefined);
    const held = payments.find((p) => p.status === 'authorised');
    const invoice = world.views.invoices.get(order.invoiceIds[0] ?? '');
    const rest = picked.totalMinor - (invoice?.paidMinor ?? 0);
    const t2 = t + rng.int(2, 15) * minute;
    at(t2, () => {
      if (held && rest <= 0) voidHold(world, serhii, held.paymentId, 'Paid in full with bonus points', iso(t2));
      else if (held) {
        const amount = Math.min(rest, held.amountMinor);
        requestCapture(world, held.paymentId, amount, 'api:oms', oms, iso(t2));
        logCall(t2, 'POST', `/v1/payments/${held.paymentId}/capture`, 200, 'key-r-oms', `captured ${amount}${amount < held.amountMinor ? `, released ${held.amountMinor - amount}` : ''}`, `idem-cap-${held.paymentId.slice(4)}`);
      } else if (rest < 0) {
        // Paid in full before picking (a transfer, instalments): what was picked for less goes back.
        const paid = payments.find((p) => p.capturedMinor >= -rest && p.instrument !== 'bonus_points');
        if (paid) refundPayment(world, serhii, paid.paymentId, -rest, 'picked_less', iso(t2));
      }
      deliver(orderId, t2);
    });
  };
  const deliver = (orderId: string, t: number) => {
    const shipped = t + rng.int(30, 150) * minute;
    at(shipped, () => markFulfilment(world, null, orderId, 'shipped', iso(shipped), { carrier: 'Yarmarok Delivery', ref: `YD${rng.int(1_000_000, 9_999_999)}` }));
    const delivered = shipped + rng.int(40, 220) * minute;
    at(delivered, () => {
      markFulfilment(world, null, orderId, 'delivered', iso(delivered));
      if (rng.chance(0.025)) {
        const t2 = delivered + rng.int(2, 48) * hour;
        at(t2, () => {
          const order = world.views.orders.get(orderId);
          const payment = order?.paymentIds.map((id) => world.views.payments.get(id)).find((p) => p && p.capturedMinor > 0 && p.instrument !== 'bonus_points');
          if (!payment) return;
          const amount = Math.max(1_000, Math.floor(payment.capturedMinor * rng.int(5, 35) / 100 / 100) * 100);
          refundPayment(world, serhii, payment.paymentId, Math.min(amount, payment.capturedMinor), rng.pick(['damaged', 'requested_by_customer', 'not_delivered']), iso(t2));
        });
      }
    });
  };

  // One online order of the web shop or the app: some part-paid with bonus points, the rest by an
  // instrument the payer prefers; held until picking. The last few of the history are still waiting for it.
  const onlineOrder = (t: number, pickLater = true) => {
    const unitId = rng.chance(0.52) ? 'rt-web' : 'rt-app';
    const payerRef = `py_yar${rng.int(1, 3_200)}`;
    const lines = linesOf(groceryProducts, rng.int(4, 14), () => (rng.chance(0.25) ? rng.int(2, 4) : 1));
    const placed = placeOrder(world, { unitId, channel: unitId === 'rt-web' ? 'web' : 'app', lines, payerRef }, oms, iso(t));
    if ('error' in placed) return;
    logCall(t - 2_000, 'POST', '/v1/orders', 201, 'key-r-oms', `created ${placed.orderId}`, `idem-${placed.orderId.slice(4)}`);
    const total = lines.reduce((s, l) => s + l.totalMinor, 0);
    const points = balance(payerRef);
    const big = total >= 300_000;
    const instrument = rng.weighted<InstrumentId>(big ? { card: 44, apple_pay: 16, google_pay: 13, installments: 10, pay_by_bank: 8, qr_nbu: 9 } : { card: 52, apple_pay: 17, google_pay: 14, pay_by_bank: 4, qr_nbu: 4 });
    const afterPaid = (t2: number) => { if (!pickLater) return; const t3 = t2 + rng.int(60, 300) * minute; at(t3, () => pickAndCapture(placed.orderId, t3)); };
    const giveBack = (t2: number) => {
      // The order cannot be paid in full: the bonus points it took go back, and the order system cancels it.
      const order = world.views.orders.get(placed.orderId);
      const bonus = order?.paymentIds.map((id) => world.views.payments.get(id)).find((p) => p?.instrument === 'bonus_points' && p.capturedMinor > 0);
      const t3 = t2 + rng.int(10, 40) * minute;
      if (bonus) at(t3, () => refundPayment(world, serhii, bonus.paymentId, bonus.capturedMinor, 'cancelled', iso(t3)));
    };
    const payRest = (t2: number) => pay(placed.invoiceId, instrument, t2, afterPaid, { onFailed: giveBack });
    if (points > 0 && rng.chance(0.3)) {
      const use = Math.min(points, Math.floor(total * 0.3 / 100) * 100);
      if (use >= 1_000) { pay(placed.invoiceId, 'bonus_points', t + minute, () => payRest(t + 3 * minute), { amountMinor: use }); return; }
    }
    payRest(t + minute);
  };

  // Payment on delivery: the order is picked first, the invoice follows the picked total, and the payer
  // pays at the door — by QR with an instant transfer, or by card through the link.
  const doorOrder = (t: number) => {
    const lines = linesOf(groceryProducts, rng.int(3, 10), () => 1);
    const placed = placeOrder(world, { unitId: 'rt-door', channel: 'link', lines, payerRef: `py_yar${rng.int(1, 3_200)}`, send: 'link' }, oms, iso(t));
    if ('error' in placed) return;
    const t2 = t + rng.int(90, 300) * minute;
    at(t2, () => {
      const order = world.views.orders.get(placed.orderId);
      if (!order) return;
      // Paid after picking, at the door: weighed goods are charged at what the scales showed, above the estimate or below it.
      const changes: Array<{ sku: string; kind: 'weight'; deltaMinor: number }> = [];
      const picked = order.lines.map((l) => {
        if (!groceryProducts.find((p) => p.sku === l.sku)?.weighed) return l;
        const total = Math.round((l.totalMinor * rng.int(940, 1_030)) / 1_000);
        if (total !== l.totalMinor) changes.push({ sku: l.sku, kind: 'weight', deltaMinor: total - l.totalMinor });
        return { ...l, unitMinor: total, totalMinor: total };
      });
      recordPicking(world, placed.orderId, { lines: picked, changes }, omsWorld, iso(t2));
      markFulfilment(world, null, placed.orderId, 'shipped', iso(t2 + 10 * minute), { carrier: 'Yarmarok Delivery', ref: `YD${rng.int(1_000_000, 9_999_999)}` });
      const t3 = t2 + rng.int(60, 200) * minute;
      at(t3, () => pay(placed.invoiceId, rng.chance(0.7) ? 'qr_nbu' : 'card', t3, (t4) => at(t4 + 5 * minute, () => markFulfilment(world, null, placed.orderId, 'delivered', iso(t4 + 5 * minute)))));
    });
  };

  // A company's order of gift certificates or catering, invoiced with payment terms and reminded on schedule.
  const corporateOrder = (t: number) => {
    const lines = linesOf(corporateProducts, rng.int(1, 2), () => rng.int(10, 60));
    const placed = placeOrder(world, { unitId: 'rt-b2b', channel: 'invoice', lines, payerRef: `py_corp${rng.int(1, 60)}`, send: 'email' }, { via: 'door', actor: 'r-serhii', role: 'operator' }, iso(t));
    if ('error' in placed) return;
    const reminders = (policyValue(effectiveFor(world, 'rt-b2b'), 'invoices.reminders') as number[] | null) ?? [];
    const invoice = world.views.invoices.get(placed.invoiceId);
    reminders.forEach((offset, step) => {
      const t3 = (invoice ? Date.parse(invoice.dueAt) : t) + offset * day + 9 * hour;
      at(t3, () => { const inv = world.views.invoices.get(placed.invoiceId); if (inv && inv.paidMinor === 0 && !inv.voided) remindInvoice(world, placed.invoiceId, step, 'email', 'r-serhii', iso(t3)); });
    });
    if (rng.chance(0.1)) return;
    const t2 = t + rng.int(6, 8 * 24) * hour;
    at(t2, () => pay(placed.invoiceId, rng.weighted<InstrumentId>({ bank_transfer: 6, qr_nbu: 3, card: 1 }), t2, () => undefined));
  };

  // The stores' card sales of one day, which the platform does not process: the tills' record, the
  // terminal bank's report with its breakdown, and — later the same day — the bank's credit.
  const storeDay = (storeId: string, dayStart: number) => {
    const storeInfo = retailStores.find((s) => s.unitId === storeId)!;
    const region = world.units.find((u) => u.id === storeId)!.parentId!;
    const acquirer = String(policyValue(effectiveFor(world, storeId), 'pos.acquirer') ?? 'acq-dnipro');
    const terms = acquiringTermsFor(world, 'rt-retail', acquirer, 'in_store');
    const weekday = new Date(dayStart).getUTCDay();
    const d = (dayStart - start) / day;
    const volume = Math.round(storeInfo.dailyMinor * (weekday === 6 ? 1.24 : weekday === 0 ? 1.12 : weekday === 1 ? 0.94 : 1) * (0.95 + 0.1 * (d / days)) * (0.92 + rng.next() * 0.16));
    const mix = regionIssuerMix[region]!;
    const mixTotal = Object.values(mix).reduce((a, b) => a + b, 0);
    const lines: SettlementLine[] = [];
    const overbilled = region === 'rt-east' && acquirer === 'acq-stepove' && dayStart >= end - 12 * day && dayStart < end - 6 * day;
    for (const [issuerId, share] of Object.entries(mix)) {
      const issuer = issuers.find((i) => i.id === issuerId);
      for (const [product, pshare] of Object.entries(productMix)) {
        const gross = Math.round((volume * share * pshare * (0.9 + rng.next() * 0.2)) / (mixTotal * 100));
        if (gross <= 0) continue;
        const scheme = issuer ? (issuer.bins.find((b) => b.product === product) ?? issuer.bins[0]!).scheme : 'visa';
        const onUs = issuer?.acquirerIds.includes(acquirer) ?? false;
        const billedAs = overbilled && product === 'debit' ? 'premium' : product;
        const fee = terms ? acquiringCostOf(terms, { scheme, product: billedAs, domestic: issuerId !== 'foreign', onUs }, gross).totalMinor : 0;
        lines.push({ issuer: issuer?.id ?? null, scheme, product: product as SettlementLine['product'], onUs, count: Math.max(1, Math.round(gross / storeInfo.ticketMinor)), grossMinor: gross, feeMinor: fee });
      }
    }
    const gross = lines.reduce((s, l) => s + l.grossMinor, 0);
    const count = lines.reduce((s, l) => s + l.count, 0);
    const date = ymd(dayStart);
    const batchId = `stl_${acquirer}_${storeId}_${date.replace(/-/g, '')}`;
    const missingTerminal = storeId === 'rt-kyiv-4' && date === ymd(end - 8 * day);
    at(dayStart + day + hour, () => appendFacts(world, batchId, [{ type: 'sales.Reported', payload: { batchId, source: 'pos', provider: acquirer, merchantId: 'rt-retail', storeId, businessDate: date, currency: 'UAH', count, grossMinor: gross } }], { via: 'world', controller: `pos:${storeId}`, answering: null }, iso(dayStart + day + hour)));
    if (storeId === 'rt-west-3' && date === ymd(end - 5 * day)) return;
    const reportedLines = missingTerminal ? lines.map((l) => ({ ...l, grossMinor: Math.round(l.grossMinor * 0.968), feeMinor: Math.round(l.feeMinor * 0.968), count: Math.round(l.count * 0.968) })) : lines;
    const reportedGross = reportedLines.reduce((s, l) => s + l.grossMinor, 0);
    const fee = reportedLines.reduce((s, l) => s + l.feeMinor, 0);
    const refunds = Math.round(reportedGross * 0.003);
    if (storeId === 'rt-south-2' && date === ymd(end - 4 * day)) world.quirks[batchId] = { shortCreditMinor: 125_000 };
    at(dayStart + day + 6.5 * hour, () => appendFacts(world, batchId, [{ type: 'settlement.Reported', payload: {
      batchId, provider: acquirer, merchantId: 'rt-retail', storeId, channel: 'in_store', businessDate: date, valueDate: ymd(dayStart + day), currency: 'UAH',
      count: reportedLines.reduce((s, l) => s + l.count, 0), grossMinor: reportedGross, feeMinor: fee, refundsMinor: refunds, chargebacksMinor: 0, netMinor: reportedGross - fee - refunds, lines: reportedLines,
    } }], { via: 'world', controller: `${acquirer}:settlement-report`, answering: null }, iso(dayStart + day + 6.5 * hour)));
  };

  // Ordinary trade, day by day.
  for (let d = 0; d < days; d += 1) {
    const date = start + d * day;
    const weekday = new Date(date).getUTCDay();
    const growth = 0.8 + 0.4 * (d / days);
    const perDay = Math.round(26 * growth * (weekday === 6 || weekday === 0 ? 1.3 : 1));
    for (let i = 0; i < perDay; i += 1) { const t = date + rng.int(7, 22) * hour + rng.int(0, 59) * minute; at(t, () => onlineOrder(t)); }
    const doors = Math.round(4 * growth);
    for (let i = 0; i < doors; i += 1) { const t = date + rng.int(8, 18) * hour + rng.int(0, 59) * minute; at(t, () => doorOrder(t)); }
    if (weekday !== 0 && weekday !== 6 && rng.chance(0.7)) { const t = date + rng.int(9, 17) * hour; at(t, () => corporateOrder(t)); }
    for (const store of retailStores) at(date + day + 30 * minute, () => storeDay(store.unitId, date));
    at(date + 7 * hour, () => {
      runPayouts(world, iso(date + 7 * hour)); expireSessions(world, iso(date + 7 * hour)); expireInvoices(world, iso(date + 7 * hour));
      // The order system cancels online orders left part-paid past their due date, and gives the bonus points back.
      for (const order of world.views.orders.values()) {
        if (order.unitId !== 'rt-web' && order.unitId !== 'rt-app') continue;
        const invoice = world.views.invoices.get(order.invoiceIds[0] ?? '');
        if (!invoice || invoice.paidMinor >= invoice.amountMinor || Date.parse(invoice.dueAt) > date + 7 * hour) continue;
        if (order.paymentIds.some((id) => world.views.payments.get(id)?.status === 'authorised')) continue;
        const bonus = order.paymentIds.map((id) => world.views.payments.get(id)).find((p) => p?.instrument === 'bonus_points' && p.capturedMinor > p.refundedMinor);
        if (bonus) refundPayment(world, serhii, bonus.paymentId, bonus.capturedMinor - bonus.refundedMinor, 'cancelled', iso(date + 7 * hour + minute));
      }
    });
    at(date + 16 * hour, () => creditSettlements(world, iso(date + 16 * hour)));
    at(date + 21 * hour, () => { expireSessions(world, iso(date + 21 * hour)); logCall(date + 21 * hour, 'GET', `/v1/settlements?date=${ymd(date)}`, 200, 'key-r-erp', 'read the day’s settlement batches'); });
  }

  // Stories for the agents and the cabinets.
  // The last online orders of the history are paid and still waiting for picking: the operator's queue.
  for (let k = 1; k <= 6; k += 1) { const t = end - k * 23 * minute; at(t, () => onlineOrder(t, false)); }
  // The online batch of Bank Dnipro three days ago is reported but never credited; the bonus system's
  // report six days ago misses a redemption reversed on its side.
  world.quirks[`stl_acq-dnipro_rt-online_${ymd(end - 3 * day).replace(/-/g, '')}`] = { noCredit: true };
  world.quirks[`stl_bonus-system_rt-online_${ymd(end - 6 * day).replace(/-/g, '')}`] = { grossDeltaMinor: -34_000 };
  // Card testing on the web shop: one payer, seven foreign cards in half an hour, all declined.
  for (let k = 0; k < 7; k += 1) {
    const t = end - 6 * hour + k * 4 * minute;
    at(t, () => {
      const placed = placeOrder(world, { unitId: 'rt-web', channel: 'web', lines: [{ sku: 'GFT-500', title: corporateProducts[1]!.title, quantity: 1, unitMinor: 50_000, totalMinor: 50_000, sellerUnitId: null }], payerRef: 'py_yar_tester' }, oms, iso(t));
      if ('error' in placed) return;
      const opened = startSession(world, placed.invoiceId, { channel: 'web', locale: 'en-GB', country: 'UA', payerHandle: 'py_yar_tester' }, iso(t + 10_000));
      if ('error' in opened) return;
      submitInstrument(world, opened.sessionId, 'card', { brand: 'visa', last4: String(5_200 + k * 131).slice(-4), bin: rng.pick(foreignBins), issuerCountry: rng.pick(['US', 'BR', 'GB']) }, { issuer: 'decline', issuerWantsChallenge: false }, iso(t + 30_000));
    });
  }
  // Two disputes on recent card payments, waiting for the evidence.
  for (const [back, reason] of [[3, 'not_received'], [1, 'not_as_described']] as const) {
    const t = end - back * day + 10 * hour;
    at(t, () => {
      const payment = [...world.views.payments.values()].findLast((p) => p.instrument === 'card' && p.status === 'captured' && p.disputes.length === 0 && p.capturedAt !== null && Date.parse(p.capturedAt) < t - 4 * day);
      if (!payment) return;
      appendFacts(world, payment.paymentId, [{ type: 'dispute.Opened', payload: { paymentId: payment.paymentId, disputeId: `dp_${payment.paymentId.slice(4, 10)}`, orderId: payment.orderId, amountMinor: payment.capturedMinor, currency: payment.currency, reason, respondBy: iso(t + 10 * day) } }], { via: 'world', controller: `${payment.acquirer}:scheme`, answering: null }, iso(t));
    });
  }

  // The agents look every week and more often lately; people decide what they propose.
  const deciders: Record<string, Actor> = { router: mykola, reconciler: natalia, sentinel: anna, analyst: anna, clerk: serhii, collector: serhii, copilot: yurii };
  for (const back of [63, 49, 35, 30, 23, 14, 7, 3]) {
    const t = end - back * day + 9 * hour;
    at(t, () => {
      const before = new Set(world.insights.map((i) => i.id));
      refreshSwarm(world, iso(t));
      for (const insight of world.insights.filter((i) => i.status === 'open')) {
        const decider = deciders[insight.agent];
        const kind = insight.proposal?.kind;
        if (!decider) continue;
        const params = insight.proposal?.params ?? {};
        // The story: on-us first is accepted thirty days ago, Kyiv's terminals move to Bank Dnipro three
        // weeks ago; claims, negotiations and the newest findings wait for the people of the demo.
        let accept: boolean | null = null;
        if (kind === 'change_policy') accept = (params.key === 'routing.strategy' && back === 30) || (params.key === 'pos.acquirer' && params.unitId === 'rt-kyiv' && back === 23) ? true : null;
        else if (kind !== 'negotiate_terms' && kind !== 'raise_claim' && !before.has(insight.id) && back > 7) accept = rng.chance(0.7);
        if (accept === null) continue;
        const t2 = t + rng.int(1, 6) * hour;
        at(t2, () => decideInsight(world, decider, insight.id, accept, iso(t2)));
      }
    });
  }

  for (let event = queue.pop(); event; event = queue.pop()) {
    if (event.at >= end) break;
    if (world.quiet && event.at > end - 2 * day) world.quiet = false;
    event.run();
  }
  world.quiet = false;
  runPayouts(world, now);
  creditSettlements(world, now);
  expireSessions(world, now);
  expireInvoices(world, now);
  // Older alerts were handled; the recent ones wait.
  for (const alert of world.alerts) {
    if (alert.status !== 'new' || end - Date.parse(alert.openedAt) < 3 * day) continue;
    alert.status = 'closed';
    alert.assignee = 'r-anna';
    alert.updatedAt = new Date(Date.parse(alert.openedAt) + rng.int(2, 30) * hour).toISOString();
    alert.notes.push({ at: alert.updatedAt, by: 'r-anna', text: { 'en-GB': 'Checked; no further action', uk: 'Перевірено; подальших дій не потрібно' } });
  }
}
