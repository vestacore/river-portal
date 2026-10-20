import type { InstrumentDetail, InstrumentId, OrderLine } from '@river/psp-facts';
import type { ApiLogEntry } from '@river/psp-integration';
import { isSessionClosed } from '@river/psp-session';
import { isWithin, policyValue } from '@river/psp-units';
import { captureHold } from './captureHold.ts';
import { createQueue } from './createQueue.ts';
import { createRng } from './createRng.ts';
import { demoMerchants, type MerchantPlan } from './data/demoMerchants.ts';
import { decideInsight } from './decideInsight.ts';
import { decideReview } from './decideReview.ts';
import { driveSession } from './driveSession.ts';
import { effectiveFor } from './effectiveFor.ts';
import { expireInvoices } from './expireInvoices.ts';
import { expireSessions } from './expireSessions.ts';
import { markFulfilment } from './markFulfilment.ts';
import { payerGesture } from './payerGesture.ts';
import { placeOrder } from './placeOrder.ts';
import { refreshSwarm } from './refreshSwarm.ts';
import { refundPayment } from './refundPayment.ts';
import { appendFacts } from './appendFacts.ts';
import { remindInvoice } from './remindInvoice.ts';
import { runPayouts } from './runPayouts.ts';
import { startSession } from './startSession.ts';
import { submitInstrument } from './submitInstrument.ts';
import type { Actor, Scenario, Waiting, World } from './types/World.ts';
import { voidHold } from './voidHold.ts';

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

const iryna: Actor = { kind: 'person', personId: 'p-iryna', grantId: 'gr-iryna-ops', role: 'operator', unitId: 'ou-ua' };
const lina: Actor = { kind: 'person', personId: 'p-lina', grantId: 'gr-lina-ops', role: 'operator', unitId: 'ou-eu' };
const marta: Actor = { kind: 'person', personId: 'p-marta', grantId: 'gr-marta-aml', role: 'compliance_officer', unitId: 'ou-riverpay' };
const andrii: Actor = { kind: 'person', personId: 'p-andrii', grantId: 'gr-andrii-admin', role: 'hierarchy_admin', unitId: 'ou-riverpay' };
const oleksii: Actor = { kind: 'person', personId: 'p-oleksii', grantId: 'gr-oleksii-int', role: 'integrator', unitId: 'ou-kvitka' };
const euCountries = ['LT', 'LV', 'EE', 'PL', 'DE', 'FI'];

/**
 * The demo's history, replayed through the same functions a live payment uses: orders and invoices, then
 * attempts that choose instruments, pass screening and routing, meet challenges, banks, lenders and pushed
 * money, retry when declined, wait for capture or review — and after the mouth, fulfilment, refunds,
 * disputes and payouts on schedule. A queue keeps every event in time order, so every screening reads the
 * world as it was at that moment. Webhooks and the API log are kept for the last two days only.
 */
export function seedHistory(world: World, now: string, days = 75): void {
  const rng = createRng(20_261_019);
  const end = Date.parse(now);
  const start = end - days * day;
  const queue = createQueue();
  const iso = (t: number) => new Date(Math.min(t, end - minute)).toISOString();
  const at = (t: number, run: () => void) => { if (t < end) queue.push(t, run); };
  const operatorFor = (unitId: string) => (world.units.find((u) => u.id === unitId)?.currency === 'EUR' ? lina : iryna);
  const willPush = new Map<string, boolean>();
  const storyPayers = new Set(['py_amb_structurer', 'py_kro_mismatch']);
  const overrides: Record<string, Partial<Scenario>> = { py_kro_mismatch: { mismatchMinor: -50_000 } };

  const detailFor = (instrument: InstrumentId, plan: MerchantPlan, eu: boolean): InstrumentDetail => {
    const foreign = rng.chance(plan.foreignCards);
    const home = eu ? rng.pick(euCountries) : 'UA';
    const country = foreign ? rng.pick(eu ? ['US', 'GB', 'UA', 'CH'] : ['PL', 'DE', 'GB', 'US', 'MD']) : home;
    const last4 = String(rng.int(0, 9_999)).padStart(4, '0');
    if (instrument === 'card' || instrument === 'apple_pay' || instrument === 'google_pay') {
      const brand = !eu && rng.chance(0.06) ? 'prostir' : rng.chance(0.6) ? 'visa' : 'mastercard';
      return { brand, last4, bin: brand === 'visa' ? `4${rng.int(10_000, 99_999)}` : brand === 'prostir' ? `9804${rng.int(10, 99)}` : `5${rng.int(10_000, 59_999)}`, issuerCountry: country, ...(instrument !== 'card' ? { wallet: instrument } : {}) };
    }
    if (instrument === 'installments' || instrument === 'bnpl') return { parts: instrument === 'bnpl' ? 3 : rng.pick([3, 4, 6, 10]), bank: instrument === 'bnpl' ? 'Later Lending EU' : 'Chastyny Credit' };
    if (instrument === 'stablecoin') return { network: 'Ethereum' };
    if (instrument === 'wallet') return { wallet: 'Wallet Network' };
    if (instrument === 'voucher') return { network: 'Kiosk Network UA' };
    return { bank: eu ? rng.pick(['Nordbank (demo)', 'Baltic Savings (demo)']) : rng.pick(['Bank Dnipro (demo)', 'Bank Polissia (demo)', 'Bank Karpaty (demo)']) };
  };

  // The stand-in world's answers for one attempt. Pushed money waits: the transfer, the cash, the debit
  // arrive later, by a gesture the queue schedules — or never, and the clock closes the attempt.
  const scenarioFor = (instrument: InstrumentId, payerRef: string): Omit<Scenario, 'challenge'> & { issuerWantsChallenge: boolean } => ({
    issuer: 'by_acquirer', issuerWantsChallenge: instrument === 'card' && rng.chance(0.3),
    challengePass: rng.chance(0.95), device: rng.chance(0.98), consent: rng.chance(0.93), credit: rng.chance(instrument === 'bnpl' ? 0.86 : 0.82),
    pushed: false, ...(overrides[payerRef] ?? {}),
  });

  // What happens after each drive: the next gesture of the payer or the world, or the life after the mouth.
  const follow = (sessionId: string, waiting: Waiting | { error: string }, t: number, plan: MerchantPlan, attempt: number) => {
    if (typeof waiting !== 'string') return;
    const session = world.views.sessions.get(sessionId);
    if (!session) return;
    const scenario = world.scenarios.get(sessionId);
    const again = (w: Waiting | { error: string }, t2: number) => follow(sessionId, w, t2, plan, attempt);
    switch (waiting) {
      case 'challenge': { const t2 = t + rng.int(30, 120) * 1_000; at(t2, () => again(payerGesture(world, sessionId, { kind: 'challenge', pass: scenario?.challengePass ?? true }, iso(t2)), t2)); break; }
      case 'device': { const t2 = t + rng.int(5, 25) * 1_000; if (scenario?.device) at(t2, () => again(payerGesture(world, sessionId, { kind: 'device' }, iso(t2)), t2)); break; }
      case 'consent': { const t2 = t + rng.int(1, 5) * minute; at(t2, () => again(payerGesture(world, sessionId, { kind: 'consent', approve: scenario?.consent ?? true }, iso(t2)), t2)); break; }
      case 'mandate': { const t2 = t + rng.int(1, 3) * minute; at(t2, () => again(payerGesture(world, sessionId, { kind: 'mandate', iban: 'DE89370400440532013000' }, iso(t2)), t2)); break; }
      case 'funds': {
        const wait = session.instrument === 'bank_transfer' ? rng.int(2, 30) * hour : session.instrument === 'voucher' ? rng.int(1, 40) * hour : session.instrument === 'direct_debit' ? 2 * day + rng.int(1, 8) * hour : rng.int(1, 30) * minute;
        if (willPush.get(sessionId)) { const t2 = t + wait; at(t2, () => again(payerGesture(world, sessionId, { kind: 'funds' }, iso(t2)), t2)); }
        break;
      }
      case 'review': {
        const payer = world.views.orders.get(session.orderId)?.payerRef ?? '';
        if (session.failure?.code.startsWith('mismatch_') || storyPayers.has(payer)) break;
        const t2 = t + rng.int(20, 200) * minute;
        at(t2, () => {
          decideReview(world, marta, sessionId, rng.chance(0.88), rng.chance(0.5) ? 'Checked: known customer' : '', iso(t2));
          const s = world.views.sessions.get(sessionId);
          if (s && !isSessionClosed(s)) follow(sessionId, driveSession(world, sessionId, iso(t2)), t2, plan, attempt);
          else afterMouth(sessionId, t2, plan);
        });
        break;
      }
      case 'capture': {
        const roll = rng.next();
        const t2 = t + rng.int(18, 60) * hour;
        if (roll < 0.94) at(t2, () => { const p = session.paymentId; if (p) { markFulfilment(world, null, session.orderId, 'shipped', iso(t2), { carrier: 'Baltic Parcel', ref: `BP${rng.int(100_000, 999_999)}` }); captureHold(world, lina, p, iso(t2 + 2 * minute)); afterMouth(sessionId, t2, plan); } });
        else if (roll < 0.97) at(t2, () => { if (session.paymentId) voidHold(world, lina, session.paymentId, 'Out of stock', iso(t2)); });
        break;
      }
      case 'done': afterMouth(sessionId, t, plan); break;
      case 'failed': {
        if (attempt < 3 && session.outcome === 'failed' && rng.chance(0.5)) {
          const t2 = t + rng.int(2, 15) * minute;
          at(t2, () => tryToPay(session.invoiceId, plan, t2, attempt + 1));
        }
        break;
      }
    }
  };

  // After the mouth: goods move, a few payments are refunded or disputed.
  const afterMouth = (sessionId: string, t: number, plan: MerchantPlan) => {
    const session = world.views.sessions.get(sessionId);
    if (!session || session.outcome !== 'succeeded' || !session.paymentId) return;
    const paymentId = session.paymentId;
    if (t > end - 9 * day && t < end - 6 * day && world.lostSettlement.length < 3 && rng.chance(0.03)) world.lostSettlement.push(paymentId);
    if (plan.goods && plan.merchantId !== 'ou-baltic-bikes') {
      at(t + rng.int(1, 5) * hour, () => markFulfilment(world, null, session.orderId, 'accepted', iso(t + 5 * hour)));
      const shipped = t + rng.int(20, 50) * hour;
      at(shipped, () => markFulfilment(world, null, session.orderId, 'shipped', iso(shipped), { carrier: plan.merchantId === 'ou-amber' ? 'Baltic Parcel' : 'Lastivka Logistics', ref: `LL${rng.int(10_000_000, 99_999_999)}` }));
      const delivered = shipped + rng.int(18, 72) * hour;
      at(delivered, () => markFulfilment(world, null, session.orderId, 'delivered', iso(delivered)));
    }
    if (plan.merchantId === 'ou-baltic-bikes') { const d = t + rng.int(24, 72) * hour; at(d, () => markFulfilment(world, null, session.orderId, 'delivered', iso(d))); }
    if (rng.chance(plan.merchantId === 'ou-open-river' ? 0.004 : 0.03)) {
      const t2 = t + rng.int(1, 20) * day;
      at(t2, () => {
        const payment = world.views.payments.get(paymentId);
        if (!payment || payment.capturedMinor === 0) return;
        const amount = rng.chance(0.4) ? payment.capturedMinor : Math.max(100, Math.floor(payment.capturedMinor * rng.int(20, 70) / 100));
        refundPayment(world, operatorFor(payment.unitId), paymentId, amount, rng.pick(['returned', 'damaged', 'cancelled', 'duplicate']), iso(t2));
      });
    }
    if ((session.instrument === 'card' || session.instrument === 'apple_pay') && rng.chance(0.006)) {
      const opened = t + rng.int(8, 40) * day;
      at(opened, () => {
        const payment = world.views.payments.get(paymentId);
        if (!payment || payment.status !== 'captured') return;
        const disputeId = `dp_${paymentId.slice(4, 10)}`;
        const respondBy = new Date(opened + 10 * day).toISOString();
        appendFacts(world, paymentId, [{ type: 'dispute.Opened', payload: { paymentId, disputeId, orderId: payment.orderId, amountMinor: payment.capturedMinor, currency: payment.currency, reason: rng.pick(['fraud', 'not_received', 'not_as_described'] as const), respondBy } }], { via: 'world', controller: `${payment.acquirer}:scheme`, answering: null }, iso(opened));
        const decided = opened + rng.int(14, 30) * day;
        const evidenced = opened + rng.int(2, 6) * day;
        // The newest disputes still wait for the operator's evidence.
        if (evidenced < end - day) at(evidenced, () => appendFacts(world, paymentId, [{ type: 'dispute.Evidenced', payload: { paymentId, disputeId, documents: rng.int(2, 5), by: 'p-iryna' } }], { via: 'door', actor: 'p-iryna', role: 'operator' }, iso(evidenced)));
        at(decided, () => {
          const p = world.views.payments.get(paymentId);
          if (!p) return;
          if (rng.chance(0.6)) appendFacts(world, paymentId, [{ type: 'dispute.Won', payload: { paymentId, disputeId, orderId: p.orderId } }], { via: 'world', controller: `${p.acquirer}:scheme`, answering: null }, iso(decided));
          else {
            const shares = p.allocations.filter((a) => a.role !== 'psp_fee');
            const total = shares.reduce((s, a) => s + a.amountMinor, 0);
            const back = shares.map((a) => ({ ...a, amountMinor: -Math.floor((a.amountMinor * p.capturedMinor) / Math.max(1, total)), holdUntil: null }));
            const diff = p.capturedMinor + back.reduce((s, a) => s + a.amountMinor, 0);
            if (back[back.length - 1]) back[back.length - 1]!.amountMinor -= diff;
            appendFacts(world, paymentId, [{ type: 'dispute.Lost', payload: { paymentId, disputeId, invoiceId: p.invoiceId, orderId: p.orderId, acquirer: p.acquirer, amountMinor: p.capturedMinor, currency: p.currency, allocations: back } }], { via: 'world', controller: `${p.acquirer}:scheme`, answering: null }, iso(decided));
          }
        });
      });
    }
  };

  const tryToPay = (invoiceId: string, plan: MerchantPlan, t: number, attempt: number) => {
    const invoice = world.views.invoices.get(invoiceId);
    if (!invoice) return;
    const eu = invoice.currency === 'EUR';
    const order = world.views.orders.get(invoice.orderId);
    const opened = startSession(world, invoiceId, { channel: order?.channel ?? 'web', locale: rng.chance(eu ? 0.85 : 0.2) ? 'en-GB' : 'uk', country: eu ? rng.pick(euCountries) : 'UA', payerHandle: order?.payerRef ?? 'payer' }, iso(t));
    if ('error' in opened) return;
    const sessionId = opened.sessionId;
    if (rng.chance(0.05)) return;
    const allowed = (policyValue(effectiveFor(world, invoice.unitId), 'instruments.allowed') as string[] | null) ?? ['card'];
    const mix = Object.fromEntries(Object.entries(plan.mix).filter(([k]) => allowed.includes(k))) as Partial<Record<InstrumentId, number>>;
    const instrument = Object.keys(mix).length > 0 ? rng.weighted(mix) : 'card';
    const payerRef = order?.payerRef ?? '';
    willPush.set(sessionId, payerRef in overrides || rng.chance(instrument === 'voucher' ? 0.72 : instrument === 'bank_transfer' ? 0.86 : 0.95));
    const t2 = t + rng.int(20, 120) * 1_000;
    at(t2, () => follow(sessionId, submitInstrument(world, sessionId, instrument, detailFor(instrument, plan, eu), scenarioFor(instrument, payerRef), iso(t2)), t2, plan, attempt));
  };

  const linesFor = (plan: MerchantPlan): OrderLine[] => {
    const count = rng.int(plan.lines[0], plan.lines[1]);
    const chosen = new Set<number>();
    while (chosen.size < Math.min(count, plan.products.length)) chosen.add(rng.int(0, plan.products.length - 1));
    return [...chosen].map((i) => {
      const product = plan.products[i]!;
      const unitMinor = Math.round(rng.int(product.minMinor, product.maxMinor) / 100) * 100;
      const quantity = plan.merchantId.startsWith('ou-zerno') ? rng.int(1, 2) : rng.chance(0.15) ? 2 : 1;
      return { sku: product.sku, title: product.title, quantity, unitMinor, totalMinor: unitMinor * quantity, sellerUnitId: product.sellerUnitId };
    });
  };

  const newOrder = (plan: MerchantPlan, t: number, lines = linesFor(plan), payerRef?: string) => {
    const selling = rng.weighted(Object.fromEntries(plan.sellingUnits.map((s, i) => [String(i), s.share])) as Record<string, number>);
    const unit = plan.sellingUnits[Number(selling)]!;
    const placed = placeOrder(world, {
      unitId: unit.unitId, channel: unit.channel, lines, payerRef: payerRef ?? `py_${plan.merchantId.replace(/^ou-/, '').slice(0, 3)}${rng.int(1, plan.payerPool)}`,
      send: plan.invoiceFirst ? rng.pick(['email', 'messenger', 'email', 'link'] as const) : null,
    }, { via: 'door', actor: unit.channel === 'invoice' ? 'merchant' : `api:${plan.merchantId}`, role: unit.channel === 'invoice' ? 'merchant' : 'integrator' }, iso(t));
    if ('error' in placed) return null;
    if (!world.quiet && unit.channel !== 'pos' && unit.channel !== 'invoice') logCall(placed.orderId, plan.merchantId, t);
    if (plan.invoiceFirst) {
      if (rng.chance(0.13)) return placed;
      const delay = rng.chance(0.6) ? rng.int(5, 240) * minute : rng.int(4, 120) * hour;
      at(t + delay, () => tryToPay(placed.invoiceId, plan, t + delay, 1));
      const reminders = (policyValue(effectiveFor(world, unit.unitId), 'invoices.reminders') as number[] | null) ?? [];
      const invoice = world.views.invoices.get(placed.invoiceId);
      reminders.forEach((offset, step) => {
        const t3 = (invoice ? Date.parse(invoice.dueAt) : t) + offset * day + 9 * hour;
        at(t3, () => { const inv = world.views.invoices.get(placed.invoiceId); if (inv && inv.paidMinor === 0 && !inv.voided) remindInvoice(world, placed.invoiceId, step, 'email', unit.unitId.startsWith('ou-nordlicht') ? 'policy' : 'p-iryna', iso(t3)); });
      });
    } else at(t + rng.int(1, 4) * minute, () => tryToPay(placed.invoiceId, plan, t + 2 * minute, 1));
    return placed;
  };

  const logCall = (orderId: string, merchantId: string, t: number) => {
    const parent = world.units.find((u) => u.id === merchantId)?.parentId;
    const key = world.keys.find((k) => k.kind === 'secret' && k.mode === 'live' && (k.unitId === merchantId || k.unitId === parent));
    if (!key) return;
    const n = (world.counters.api ?? 0) + 1;
    world.counters.api = n;
    const failed = rng.chance(0.04);
    world.apiLog.push({ id: `req_${n.toString(36).toUpperCase().padStart(6, '0')}`, at: iso(t - 900), unitId: merchantId, keyId: key.id, mode: 'live', method: 'POST', path: '/v1/orders', status: failed ? 422 : 201, durationMs: rng.int(38, 190), idempotencyKey: `idem-${orderId.slice(4)}`, summary: failed ? 'lines[0].unitMinor: a positive whole number of minor units' : `created ${orderId}` });
    if (!failed) world.apiLog.push({ id: `req_${n.toString(36).toUpperCase().padStart(6, '0')}b`, at: iso(t + 60_000), unitId: merchantId, keyId: key.id, mode: 'live', method: 'GET', path: `/v1/orders/${orderId}`, status: 200, durationMs: rng.int(9, 40), idempotencyKey: null, summary: 'read the order view' });
    key.lastUsedAt = iso(t);
  };

  // Ordinary trade, day by day: growth over the period, weekends, business hours.
  for (let d = 0; d < days; d += 1) {
    const date = start + d * day;
    const weekday = new Date(date).getUTCDay();
    const growth = 0.72 + 0.55 * (d / days);
    for (const plan of demoMerchants) {
      const merchant = world.units.find((u) => u.id === plan.merchantId);
      if (!merchant || merchant.status !== 'active') continue;
      const expected = plan.perDay * growth * (weekday === 0 || weekday === 6 ? plan.weekend : 1);
      let n = Math.floor(expected);
      if (rng.next() < expected - n) n += 1;
      for (let i = 0; i < n; i += 1) {
        const hourOfDay = plan.merchantId.startsWith('ou-zerno') ? rng.int(5, 16) : rng.int(6, 19);
        const t = date + hourOfDay * hour + rng.int(0, 59) * minute;
        at(t, () => { newOrder(plan, t); });
      }
    }
    at(date + 7 * hour, () => { runPayouts(world, iso(date + 7 * hour)); expireSessions(world, iso(date + 7 * hour)); expireInvoices(world, iso(date + 7 * hour)); });
    at(date + 19 * hour, () => expireSessions(world, iso(date + 19 * hour)));
  }

  // Stories for the swarm and the cabinets.
  const plan = (id: string) => demoMerchants.find((p) => p.merchantId === id)!;
  const travel = plan('ou-dnipro-travel');
  const group = (n: number): OrderLine[] => [
    { sku: 'TR-HOTEL-7N', title: { 'en-GB': 'A week by the sea, group of 12', uk: 'Тиждень біля моря, група з 12 осіб' }, quantity: 12, unitMinor: 3_150_000, totalMinor: 12 * 3_150_000, sellerUnitId: 'ou-supplier-hotel' },
    { sku: 'TR-COACH', title: { 'en-GB': 'Coach transfer, return', uk: 'Трансфер автобусом, туди й назад' }, quantity: n, unitMinor: 280_000, totalMinor: n * 280_000, sellerUnitId: 'ou-supplier-coach' },
  ];
  at(end - 33 * day, () => { newOrder({ ...travel, invoiceFirst: false, mix: { card: 1 } }, end - 33 * day, group(12), 'py_dni_corporate1'); });
  at(end - 2 * day - 3 * hour, () => { newOrder({ ...travel, invoiceFirst: false, mix: { pay_by_bank: 1 } }, end - 2 * day - 3 * hour, group(12), 'py_dni_corporate2'); });
  const amber = plan('ou-amber');
  const set = (k: number): OrderLine[] => [{ sku: 'AM-SET', title: { 'en-GB': 'Jewellery set', uk: 'Ювелірний комплект' }, quantity: 1, unitMinor: 520_000 + k * 1_700, totalMinor: 520_000 + k * 1_700, sellerUnitId: null }];
  for (let k = 0; k < 3; k += 1) { const t = end - 20 * hour + k * 5 * hour; at(t, () => { newOrder({ ...amber, mix: { card: 1 }, foreignCards: 0 }, t, set(k), 'py_amb_structurer'); }); }
  for (let k = 0; k < 7; k += 1) {
    const t = end - 5 * hour + k * 6 * minute;
    at(t, () => {
      const placed = placeOrder(world, { unitId: 'ou-baltic-bikes-web', channel: 'web', lines: [{ sku: 'BB-LIGHTS', title: { 'en-GB': 'Light set', uk: 'Комплект ліхтарів' }, quantity: 1, unitMinor: 2_500, totalMinor: 2_500, sellerUnitId: null }], payerRef: 'py_bbk_tester' }, { via: 'door', actor: 'api:ou-baltic-bikes', role: 'integrator' }, iso(t));
      if ('error' in placed) return;
      const opened = startSession(world, placed.invoiceId, { channel: 'web', locale: 'en-GB', country: 'LT', payerHandle: 'py_bbk_tester' }, iso(t + 10_000));
      if ('error' in opened) return;
      submitInstrument(world, opened.sessionId, 'card', { brand: 'visa', last4: String(4_100 + k * 137).slice(-4), bin: '453201', issuerCountry: rng.pick(['US', 'BR', 'GB']) }, { issuer: 'decline', issuerWantsChallenge: false }, iso(t + 30_000));
    });
  }
  const krok = plan('ou-krok');
  at(end - 3 * day, () => { newOrder({ ...krok, invoiceFirst: false, mix: { bank_transfer: 1 } }, end - 3 * day, [{ sku: 'KR-UX', title: { 'en-GB': 'UX design intensive', uk: 'Інтенсив з UX-дизайну' }, quantity: 1, unitMinor: 1_150_000, totalMinor: 1_150_000, sellerUnitId: null }], 'py_kro_mismatch'); });

  // A known customer of Amber & Silver buys four jewellery sets at once — eight times its usual payment.
  // The Sentinel proposes to hold the payouts, and a compliance officer holds them before the payout run.
  const sets = end - 2 * day - 2 * hour;
  at(sets, () => {
    const customer = [...world.views.orders.values()].find((o) => o.merchantId === 'ou-amber' && o.status === 'paid' && o.payerRef !== 'py_amb_structurer')?.payerRef;
    newOrder({ ...amber, foreignCards: 0, mix: { card: 1 } }, sets, [{ sku: 'AM-SET', title: { 'en-GB': 'Jewellery set', uk: 'Ювелірний комплект' }, quantity: 4, unitMinor: 322_500, totalMinor: 1_290_000, sellerUnitId: null }], customer);
  });

  // Two disputes opened in the last days: the evidence is the operator's to send.
  for (const [merchantId, back, reason] of [['ou-kvitka-market', 4, 'not_as_described'], ['ou-baltic-bikes', 2, 'not_received']] as const) {
    const t = end - back * day + 11 * hour;
    at(t, () => {
      const payment = [...world.views.payments.values()].findLast((p) => p.merchantId === merchantId && p.status === 'captured' && p.instrument === 'card' && p.disputes.length === 0 && p.capturedAt !== null && Date.parse(p.capturedAt) < t - 6 * day);
      if (!payment) return;
      appendFacts(world, payment.paymentId, [{ type: 'dispute.Opened', payload: { paymentId: payment.paymentId, disputeId: `dp_${payment.paymentId.slice(4, 10)}`, orderId: payment.orderId, amountMinor: payment.capturedMinor, currency: payment.currency, reason, respondBy: iso(t + 10 * day) } }], { via: 'world', controller: `${payment.acquirer}:scheme`, answering: null }, iso(t));
    });
  }

  // Yesterday's calls that Kvitka's backend got wrong — and one with the key it replaced.
  at(end - 30 * hour, () => {
    const calls: Array<[number, number, ApiLogEntry['method'], string, string, string | null, string]> = [
      [0, 409, 'POST', '/v1/orders', 'Idempotency-Key idem-kvm-77120 was already used with a different body', 'idem-kvm-77120', 'key-kvg-live'],
      [41, 422, 'POST', '/v1/orders', 'lines[1].seller: ou-seller-pottery is not a seller of this unit', 'idem-kvm-77131', 'key-kvg-live'],
      [190, 401, 'GET', '/v1/payments', 'The key rp_live_sk_…Zx0d was revoked; use the key that replaced it', null, 'key-kvg-old'],
      [365, 429, 'GET', '/v1/sessions', 'Too many requests: 100 a second for one key; retry after 1 s', null, 'key-kvg-live'],
      [540, 503, 'POST', '/v1/refunds', 'The acquirer did not answer in time; retry with the same Idempotency-Key', 'idem-kvm-rf-0412', 'key-kvg-live'],
    ];
    for (const [minutes, status, method, path, summary, idempotencyKey, keyId] of calls) {
      const n = (world.counters.api ?? 0) + 1;
      world.counters.api = n;
      world.apiLog.push({ id: `req_${n.toString(36).toUpperCase().padStart(6, '0')}`, at: iso(end - 30 * hour + minutes * minute), unitId: 'ou-kvitka-market', keyId, mode: 'live', method, path, status, durationMs: status === 503 ? 10_000 : rng.int(12, 80), idempotencyKey, summary });
    }
  });

  // The swarm looks every week, and people decide what it proposes.
  const deciders: Record<string, (unitId: string) => Actor> = {
    sentinel: () => marta, analyst: () => marta, router: () => andrii, treasurer: () => andrii,
    reconciler: (u) => operatorFor(u), collector: (u) => operatorFor(u), clerk: (u) => operatorFor(u),
    copilot: (u) => (isWithin(world.units, u, 'ou-kvitka') ? oleksii : andrii),
  };
  for (const back of [63, 49, 35, 21, 10, 4, 2]) {
    const t = end - back * day + 8 * hour;
    at(t, () => {
      const before = new Set(world.insights.map((i) => i.id));
      refreshSwarm(world, iso(t));
      for (const insight of world.insights.filter((i) => !before.has(i.id) && i.status === 'open')) {
        // A hold must come before the payout run to mean anything, so it is decided within hours.
        const hold = insight.proposal?.kind === 'hold_payouts';
        const t2 = t + (hold ? rng.int(1, 3) : rng.int(1, 20)) * hour;
        if (!hold && back <= 4 && rng.chance(0.6)) continue;
        at(t2, () => decideInsight(world, deciders[insight.agent]!(insight.unitId), insight.id, hold || rng.chance(0.72), iso(t2)));
      }
    });
  }

  // Run the clock.
  for (let event = queue.pop(); event; event = queue.pop()) {
    if (event.at >= end) break;
    if (world.quiet && event.at > end - 2 * day) world.quiet = false;
    event.run();
  }
  world.quiet = false;
  runPayouts(world, now);
  expireSessions(world, now);
  expireInvoices(world, now);
  // Older alerts were handled: blocked attempts closed, threshold reports filed. The recent ones wait.
  for (const alert of world.alerts) {
    if (alert.status !== 'new' || end - Date.parse(alert.openedAt) < 3 * day || alert.kind === 'structuring' || alert.kind === 'sanctions') continue;
    const closedAt = new Date(Date.parse(alert.openedAt) + rng.int(2, 30) * hour).toISOString();
    alert.status = alert.kind === 'threshold' ? 'reported' : 'closed';
    alert.assignee = 'p-marta';
    alert.updatedAt = closedAt;
    alert.notes.push({ at: closedAt, by: 'p-marta', text: alert.kind === 'threshold'
      ? { 'en-GB': 'Threshold report filed with the financial intelligence unit', uk: 'Звіт про порогову операцію подано до підрозділу фінансової розвідки' }
      : { 'en-GB': 'Refused by policy; no further action', uk: 'Відмовлено за політикою; подальших дій не потрібно' } });
  }
}
