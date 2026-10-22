'use server';

import { redirect } from 'next/navigation';
import { testCardOf } from '@river/psp-checkout';
import type { InstrumentDetail, InstrumentId, OrderLine } from '@river/psp-facts';
import { invoiceDueMinor } from '@river/psp-invoice';
import { isSessionClosed } from '@river/psp-session';
import { bonusBalanceOf, invoiceByPayKey, payerGesture, regionOf, shopOrder, startSession, submitInstrument, type PayerGesture } from '@river/psp-runtime';
import type { PayState } from '../payState';
import { world, worldOfPayKey } from '../world';

function stateOf(payKey: string): PayState {
  const w = worldOfPayKey(payKey);
  const invoice = invoiceByPayKey(w, payKey);
  const none: PayState = { state: 'choose', sessionId: null, instrument: null, failure: null, paymentId: null, receiptId: null, bridges: 0, waitingFor: null, instructions: {} };
  if (!invoice) return { ...none, state: 'failed', failure: 'not_found' };
  const session = invoice.sessionIds.map((id) => w.views.sessions.get(id)).filter((s) => s !== undefined).at(-1);
  if (!session) return none;
  // Paid in part — a transfer that fell short and was taken — the rest is still the payer's to pay.
  if (session.outcome === 'succeeded' && !invoice.voided && invoiceDueMinor(invoice) > 0) return none;
  const facts = w.streams.get(session.sessionId) ?? [];
  const pick = (type: string) => facts.findLast((f) => f.type === type)?.payload as Record<string, string> | undefined;
  const transfer = pick('transfer.Instructed');
  const qr = pick('qr.Issued');
  const voucher = pick('voucher.Issued');
  const address = pick('address.Issued');
  const instructions = { iban: transfer?.iban, reference: transfer?.reference ?? qr?.reference, code: voucher?.code, expiresAt: voucher?.expiresAt, network: address?.network, address: address?.address };
  const base = { sessionId: session.sessionId, instrument: session.instrument, paymentId: session.paymentId, receiptId: session.receiptId, bridges: session.bridges, failure: session.failure ? `${session.failure.code}` : null, waitingFor: session.consent, instructions };
  const map: Record<string, PayState['state']> = { succeeded: 'done', failed: 'failed', abandoned: 'failed', expired: 'failed', review: 'review', awaiting_capture: 'capture', awaiting_funds: 'funds', awaiting_consent: 'challenge' };
  if (session.outcome === 'open') {
    if (!session.instrument) return { ...none, ...base, state: 'choose' };
    const s = w.scenarios.get(session.sessionId);
    const instrument = session.instrument;
    const waiting: PayState['state'] = instrument === 'apple_pay' || instrument === 'google_pay' ? (s?.device ? 'done' : 'device')
      : ['pay_by_bank', 'installments', 'bnpl', 'wallet'].includes(instrument) ? 'consent' : instrument === 'direct_debit' ? 'mandate' : 'choose';
    return { ...base, state: waiting };
  }
  if (isSessionClosed(session) && session.outcome !== 'succeeded') return { ...base, state: 'failed', failure: session.failure?.code ?? session.outcome };
  return { ...base, state: map[session.outcome] ?? 'choose' };
}

/** Where the attempt behind a pay key stands now (the pay page polls it while it waits for the world). */
export async function payStatus(payKey: string): Promise<PayState> {
  return stateOf(payKey);
}

/**
 * The payer chooses an instrument and pays: an attempt is opened (or the open one continued) and the
 * river goes as far as it can. Only the brand, the first six and the last four digits of a card reach
 * this server — the number itself never leaves the payer's browser — and only demo test cards are known.
 */
export async function payStart(payKey: string, instrument: InstrumentId, detail: { brand?: string; last4?: string; bin?: string; parts?: number; bank?: string; iban?: string; testNumber?: string }, locale: string): Promise<PayState> {
  const w = worldOfPayKey(payKey);
  const invoice = invoiceByPayKey(w, payKey);
  if (!invoice) return { ...stateOf(payKey), state: 'failed', failure: 'not_found' };
  const now = new Date().toISOString();
  const order = w.views.orders.get(invoice.orderId);
  const opened = startSession(w, invoice.invoiceId, { channel: order?.channel ?? 'web', locale, country: regionOf(w, invoice.unitId) === 'EU' ? 'LT' : 'UA', payerHandle: order?.payerRef ?? 'payer' }, now);
  if ('error' in opened) return { ...stateOf(payKey), state: 'failed', failure: opened.error };
  const card = instrument === 'card' && detail.testNumber ? testCardOf(detail.testNumber) : null;
  if (instrument === 'card' && !card) return { ...stateOf(payKey), state: 'failed', failure: 'not_a_test_card' };
  const facts: InstrumentDetail = instrument === 'card' && card
    ? { brand: card.brand, last4: card.number.slice(-4), bin: card.number.slice(0, 6), issuerCountry: card.issuerCountry }
    : instrument === 'apple_pay' || instrument === 'google_pay' ? { brand: 'visa', last4: '4242', wallet: instrument, issuerCountry: 'UA' }
    : instrument === 'installments' || instrument === 'bnpl' ? { parts: detail.parts ?? 3 }
    : detail.bank ? { bank: detail.bank } : {};
  const issuer = card ? (card.outcome === 'challenge' ? 'approve' : card.outcome) : 'approve';
  const result = submitInstrument(w, opened.sessionId, instrument, facts, { issuer, issuerWantsChallenge: card?.outcome === 'challenge', credit: true, ...(detail.parts ? { parts: detail.parts } : {}) }, now);
  if (typeof result !== 'string') return { ...stateOf(payKey), state: 'failed', failure: result.error };
  if (instrument === 'direct_debit' && detail.iban) payerGesture(w, opened.sessionId, { kind: 'mandate', iban: detail.iban }, now);
  return stateOf(payKey);
}

/** A gesture of the payer in the middle of an attempt — the challenge, the device, the bank's consent, the money sent. */
export async function payGesture(payKey: string, sessionId: string, gesture: PayerGesture): Promise<PayState> {
  const w = worldOfPayKey(payKey);
  const invoice = invoiceByPayKey(w, payKey);
  if (!invoice || !invoice.sessionIds.includes(sessionId)) return { ...stateOf(payKey), state: 'failed', failure: 'not_found' };
  payerGesture(w, sessionId, gesture, new Date().toISOString());
  return stateOf(payKey);
}

/** The demo shop: an order placed as the merchant's server would place it, then off to its pay page. */
export async function shopCheckout(form: FormData): Promise<void> {
  const segment = String(form.get('locale') ?? 'en-gb') === 'uk' ? 'uk' : 'en-gb';
  const unitId = String(form.get('unitId') ?? '');
  const lines: OrderLine[] = [];
  for (const [key, value] of form.entries()) {
    if (!key.startsWith('qty:')) continue;
    const quantity = Math.min(9, Math.max(0, Math.floor(Number(value) || 0)));
    if (quantity === 0) continue;
    const [, sku, unitMinor, seller, en, uk] = key.split('|');
    lines.push({ sku: sku!, title: { 'en-GB': en!, uk: uk! }, quantity, unitMinor: Number(unitMinor), totalMinor: quantity * Number(unitMinor), sellerUnitId: seller || null });
  }
  const donation = Math.round(Number(String(form.get('donation') ?? '').replace(',', '.')) * 100);
  if (donation > 0) lines.push({ sku: 'GIFT-ANY', title: { 'en-GB': 'Where it is needed most', uk: 'Туди, де найпотрібніше' }, quantity: 1, unitMinor: donation, totalMinor: donation, sellerUnitId: null });
  if (lines.length === 0) redirect(`/${segment}/shop?empty=1#${unitId}`);
  const placed = shopOrder(world(unitId.startsWith('rt-') ? 'retail' : 'psp'), { unitId, lines, payerRef: `py_guest_${Date.now().toString(36)}` }, new Date().toISOString());
  if ('error' in placed) redirect(`/${segment}/shop?error=${encodeURIComponent(placed.error)}`);
  redirect(`/${segment}/pay/${placed.payKey}`);
}

/**
 * The payer pays part of the order with bonus points: the merchant's bonus system holds the balance and
 * confirms the redemption; an attempt for that amount is opened and settled at once, and the rest of the
 * invoice stays to be paid with another instrument.
 */
export async function payBonus(payKey: string, amountMinor: number, locale: string): Promise<PayState> {
  const w = worldOfPayKey(payKey);
  const invoice = invoiceByPayKey(w, payKey);
  if (!invoice) return { ...stateOf(payKey), state: 'failed', failure: 'not_found' };
  const order = w.views.orders.get(invoice.orderId);
  const due = invoice.amountMinor - invoice.paidMinor;
  const amount = Math.min(Math.floor(amountMinor), due - 100, bonusBalanceOf(w, order?.payerRef ?? ''));
  if (!Number.isInteger(amount) || amount < 100) return { ...stateOf(payKey), state: 'failed', failure: 'bonus_amount' };
  const now = new Date().toISOString();
  const opened = startSession(w, invoice.invoiceId, { channel: order?.channel ?? 'web', locale, country: 'UA', payerHandle: order?.payerRef ?? 'payer', amountMinor: amount }, now);
  if ('error' in opened) return { ...stateOf(payKey), state: 'failed', failure: opened.error };
  const result = submitInstrument(w, opened.sessionId, 'bonus_points', { wallet: 'bonus' }, { issuer: 'approve', consent: true, issuerWantsChallenge: false }, now);
  if (typeof result !== 'string') return { ...stateOf(payKey), state: 'failed', failure: result.error };
  return stateOf(payKey);
}
