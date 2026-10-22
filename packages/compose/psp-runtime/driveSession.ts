import { activeTariffOf, feeFor } from '@river/psp-contracts';
import type { PspDraft, PspFact } from '@river/psp-facts';
import { courseFor } from '@river/psp-flow';
import { acquirers } from '@river/psp-instruments';
import { allocate } from '@river/psp-split';
import { isSessionClosed, type SessionView } from '@river/psp-session';
import { policyValue } from '@river/psp-units';
import { acquiringFeeFor } from './acquiringFeeFor.ts';
import { appendFacts } from './appendFacts.ts';
import { effectiveFor } from './effectiveFor.ts';
import { newId } from './newId.ts';
import { openAlert } from './openAlert.ts';
import type { Waiting, World } from './types/World.ts';

const world_ = (controller: string, answering: number | null = null) => ({ via: 'world' as const, controller, answering });
const figure = (by: string) => ({ via: 'figure' as const, by });

/**
 * Moves one attempt along its instrument's course as far as the river can go on its own: figure bridges
 * are written at once, the stand-in world answers as its scenario says, and the drive stops where someone
 * outside must act — the payer's challenge or device, the bank's consent, pushed money, an operator's
 * capture. From the capture to the mouth it is always the same: the fee, the split, the receipt, success.
 */
export function driveSession(world: World, sessionId: string, at: string): Waiting {
  const scenario = world.scenarios.get(sessionId) ?? { challenge: false, issuer: 'approve' as const };
  for (let guard = 0; guard < 24; guard += 1) {
    const session = world.views.sessions.get(sessionId);
    if (!session) return 'failed';
    if (session.outcome === 'succeeded') return 'done';
    if (isSessionClosed(session)) return 'failed';
    if (session.outcome === 'review') return 'review';
    if (!session.instrument || !session.route) return 'failed';
    const crossed = new Set((world.streams.get(sessionId) ?? []).map((f) => f.type));
    const next = courseFor(session.instrument, scenario.challenge).find((type) => !crossed.has(type));
    if (!next) return 'done';
    const step = (drafts: PspDraft[], origin: PspFact['origin']) => appendFacts(world, sessionId, drafts, origin, at);
    const fail = (code: string, reason: string) => { step([{ type: 'session.Failed', payload: { sessionId, invoiceId: session.invoiceId, code, reason } }], figure('flow')); return 'failed' as const; };
    const acquirer = session.route.acquirer;
    switch (next) {
      case 'authentication.Challenged':
        step([{ type: 'authentication.Challenged', payload: { sessionId, method: '3ds' } }], world_(`${acquirer}:acs`));
        return 'challenge';
      case 'authentication.Passed':
        if (scenario.challenge) {
          if (scenario.challengePass === undefined) return 'challenge';
          if (!scenario.challengePass) {
            step([{ type: 'authentication.Failed', payload: { sessionId, method: '3ds', reason: 'The payer did not confirm' } }], world_(`${acquirer}:acs`));
            return fail('authentication_failed', 'The payer did not confirm the payment');
          }
          step([{ type: 'authentication.Passed', payload: { sessionId, method: '3ds', exemption: null } }], world_(`${acquirer}:acs`));
        } else {
          const exemption = session.amountMinor <= Number(policyValue(effectiveFor(world, session.unitId), 'sca.exemption.max') ?? 0) ? 'low_value' : 'low_risk';
          step([{ type: 'authentication.Passed', payload: { sessionId, method: 'frictionless', exemption } }], world_(`${acquirer}:acs`));
        }
        break;
      case 'token.Verified':
        if (!scenario.device) return 'device';
        step([{ type: 'token.Verified', payload: { sessionId, wallet: session.instrument === 'google_pay' ? 'google_pay' : 'apple_pay' } }], world_(`wallet:${session.instrument}`));
        break;
      case 'consent.Granted':
        if (scenario.consent === undefined) return 'consent';
        if (!scenario.consent) {
          step([{ type: 'session.Abandoned', payload: { sessionId, invoiceId: session.invoiceId } }], world_('clock'));
          return 'failed';
        }
        step([{ type: 'consent.Granted', payload: { sessionId, by: acquirer } }], world_(acquirer));
        break;
      case 'credit.Approved':
        if (scenario.credit === false) {
          step([{ type: 'credit.Declined', payload: { sessionId, provider: acquirer, reason: 'The lender’s scoring declined' } }], world_(acquirer));
          return fail('credit_declined', 'The lender declined credit');
        }
        step([{ type: 'credit.Approved', payload: { sessionId, provider: acquirer, parts: scenario.parts ?? (session.instrument === 'bnpl' ? 3 : 4) } }], world_(acquirer));
        break;
      case 'transfer.Instructed':
        step([{ type: 'transfer.Instructed', payload: { sessionId, iban: session.currency === 'UAH' ? 'UA213223130000026007233566001' : 'LT603250000000000001', reference: `RP ${session.invoiceId.slice(4)}` } }], figure('flow'));
        if (!scenario.pushed) return 'funds';
        break;
      case 'qr.Issued':
        step([{ type: 'qr.Issued', payload: { sessionId, reference: `RP ${session.invoiceId.slice(4)}` } }], figure('flow'));
        if (!scenario.pushed) return 'funds';
        break;
      case 'qr.Scanned':
        if (!scenario.pushed) return 'funds';
        step([{ type: 'qr.Scanned', payload: { sessionId, bank: 'Bank Dnipro (demo)' } }], world_(acquirer));
        break;
      case 'voucher.Issued':
        step([{ type: 'voucher.Issued', payload: { sessionId, code: `${session.sessionId.slice(-4)} ${String(Date.parse(at) % 10_000).padStart(4, '0')} ${session.invoiceId.slice(-4)}`, expiresAt: new Date(Date.parse(at) + 72 * 3_600_000).toISOString() } }], figure('flow'));
        if (!scenario.pushed) return 'funds';
        break;
      case 'voucher.Paid':
        if (!scenario.pushed) return 'funds';
        step([{ type: 'voucher.Paid', payload: { sessionId, network: 'Kiosk Network UA' } }], world_(acquirer));
        break;
      case 'mandate.Signed':
        if (!scenario.mandateRef) return 'mandate';
        step([{ type: 'mandate.Signed', payload: { sessionId, mandateRef: scenario.mandateRef } }], { via: 'door', actor: 'payer', role: 'payer' });
        break;
      case 'collection.Submitted':
        step([{ type: 'collection.Submitted', payload: { sessionId, expectedAt: new Date(Date.parse(at) + 2 * 86_400_000).toISOString() } }], figure('flow'));
        if (!scenario.pushed) return 'funds';
        break;
      case 'address.Issued':
        step([{ type: 'address.Issued', payload: { sessionId, network: 'Ethereum', address: `0x${session.sessionId.replace(/[^0-9A-Z]/g, '').toLowerCase().padEnd(10, '0').slice(0, 10)}…e7a1` } }], figure('flow'));
        if (!scenario.pushed) return 'funds';
        break;
      case 'chain.Seen':
        if (!scenario.pushed) return 'funds';
        step([{ type: 'chain.Seen', payload: { sessionId, txHash: `0x${(Date.parse(at) % 1e12).toString(16)}…` } }], world_('chain:ethereum'));
        break;
      case 'confirmations.Reached':
        step([{ type: 'confirmations.Reached', payload: { sessionId, confirmations: 12 } }], world_('chain:ethereum'));
        break;
      case 'authorisation.Approved': {
        const issuer = scenario.issuer === 'by_acquirer' ? standInIssuer(sessionId, acquirer) : scenario.issuer;
        if (issuer !== 'approve') {
          const insufficient = issuer === 'insufficient_funds';
          step([{ type: 'authorisation.Declined', payload: { sessionId, code: insufficient ? '51' : '05', reason: insufficient ? 'Insufficient funds' : 'Do not honour' } }], world_(acquirer));
          return fail(insufficient ? 'insufficient_funds' : 'do_not_honour', insufficient ? 'Insufficient funds' : 'Declined by the issuer');
        }
        const paymentId = newId(world, 'pay');
        const order = world.views.orders.get(session.orderId);
        step([{ type: 'authorisation.Approved', payload: {
          sessionId, paymentId, invoiceId: session.invoiceId, orderId: session.orderId, unitId: session.unitId, merchantId: session.merchantId,
          instrument: session.instrument, detail: session.detail ?? {}, rail: session.route.rail, acquirer, amountMinor: session.amountMinor, currency: session.currency,
          authCode: String(100_000 + (Date.parse(at) % 900_000)), captureMode: order?.captureMode ?? 'auto',
        } }], world_(acquirer));
        break;
      }
      case 'funds.Received': {
        if (session.instrument === 'bank_transfer' && !scenario.pushed) return 'funds';
        // Money that did not match waits for a person; once they take it, it is received as it arrived — never more than was due.
        const stream = world.streams.get(sessionId) ?? [];
        const mismatched = stream.findLast((f) => f.type === 'funds.Mismatched');
        const taken = mismatched?.type === 'funds.Mismatched' && stream.some((f) => f.type === 'review.Cleared' && f.seq > mismatched.seq)
          ? Math.min(mismatched.payload.gotMinor, mismatched.payload.expectedMinor) : null;
        if (scenario.mismatchMinor && taken === null) {
          const got = session.amountMinor + scenario.mismatchMinor;
          const alertId = openAlert(world, { kind: 'mismatch', unitId: session.unitId, sessionId, paymentId: null, amountMinor: got, currency: session.currency, score: session.risk?.score ?? 0, reasons: [], at });
          step([{ type: 'funds.Mismatched', payload: { sessionId, alertId, expectedMinor: session.amountMinor, gotMinor: got, reason: 'amount' } }], figure('guard'));
          return 'review';
        }
        const paymentId = newId(world, 'pay');
        const via = session.instrument === 'installments' || session.instrument === 'bnpl' ? 'lender' : session.instrument === 'stablecoin' ? 'chain' : session.instrument === 'voucher' ? 'kiosk' : session.instrument === 'bank_transfer' ? 'statement' : session.instrument === 'bonus_points' ? 'loyalty' : 'rail';
        step([{ type: 'funds.Received', payload: {
          sessionId, paymentId, invoiceId: session.invoiceId, orderId: session.orderId, unitId: session.unitId, merchantId: session.merchantId,
          instrument: session.instrument, detail: session.detail ?? {}, rail: session.route.rail, acquirer, amountMinor: taken ?? session.amountMinor, currency: session.currency,
          via, captureMode: 'auto',
        } }], world_(acquirer));
        break;
      }
      case 'conversion.Completed':
        step([{ type: 'conversion.Completed', payload: { sessionId, rate: session.currency === 'EUR' ? '0.9213' : '1.0000', fiatMinor: session.amountMinor } }], world_('liquidity:usdc'));
        break;
      case 'capture.Completed':
        if (session.captureMode === 'manual' && !scenario.captureRequested) return 'capture';
        settleCapture(world, session, at);
        return 'done';
      default:
        return 'failed';
    }
  }
  return 'failed';
}

/**
 * From the capture to completion, the same for every instrument: the fee, the split, the receipt, success.
 * What is captured is what the payment secured — or less, when the order system asked for the picked total
 * (the rest of the hold is released), or when a person took a transfer that fell short. The fee is the
 * PSP's tariff where the platform holds the money, and the acquirer's price under the merchant's own terms
 * where the acquirer settles to the merchant directly; then the split's fee share is the acquirer's.
 */
function settleCapture(world: World, session: SessionView, at: string): void {
  const order = world.views.orders.get(session.orderId);
  const paymentId = session.paymentId;
  if (!order || !paymentId || !session.instrument || !session.route) return;
  const secured = world.views.payments.get(paymentId)?.amountMinor ?? session.amountMinor;
  const asked = world.scenarios.get(session.sessionId)?.captureAmountMinor;
  const amountMinor = asked !== undefined ? Math.max(0, Math.min(asked, secured)) : secured;
  const releasedMinor = secured - amountMinor;
  const acquirer = session.route.acquirer;
  const effective = effectiveFor(world, session.unitId);
  const direct = policyValue(effective, 'settlement.model') === 'direct';
  const tariff = direct ? null : activeTariffOf(world.contracts, world.tariffs, session.merchantId, at);
  const feeMinor = direct ? acquiringFeeFor(world, session, acquirer, amountMinor) : tariff ? feeFor(tariff, session.instrument, amountMinor) : 0;
  const plan = direct ? { ...order.split, rules: order.split.rules.map((r) => (r.basis === 'fee' ? { ...r, recipientUnitId: `acq:${acquirer}`, role: 'acquirer_fee' as const } : r)) } : order.split;
  const allocations = allocate({
    amountMinor, currency: session.currency, orderTotalMinor: order.picked?.totalMinor ?? order.totalMinor, lines: order.picked?.lines ?? order.lines, plan, feeMinor, at,
    reserveBps: direct ? 0 : Number(policyValue(effective, 'settlement.reserve.bps') ?? 0), reserveDays: 90,
  });
  const push = session.route.rail !== 'card' && session.route.rail !== 'wallet';
  appendFacts(world, session.sessionId, [
    { type: 'capture.Completed', payload: { sessionId: session.sessionId, paymentId, invoiceId: session.invoiceId, orderId: session.orderId, merchantId: session.merchantId, acquirer, amountMinor, currency: session.currency, feeMinor, ...(releasedMinor > 0 ? { releasedMinor } : {}) } },
  ], push ? figure('flow') : world_(acquirer), at);
  appendFacts(world, session.sessionId, [
    { type: 'split.Allocated', payload: { sessionId: session.sessionId, paymentId, orderId: session.orderId, acquirer, amountMinor, currency: session.currency, allocations } },
    { type: 'receipt.Issued', payload: { sessionId: session.sessionId, receiptId: newId(world, 'rc'), invoiceId: session.invoiceId, orderId: session.orderId, paymentId, amountMinor, currency: session.currency } },
    { type: 'session.Succeeded', payload: { sessionId: session.sessionId, invoiceId: session.invoiceId, paymentId } },
  ], figure('flow'), at);
  const amounts = world.caches.merchantAmounts.get(session.merchantId) ?? [];
  amounts.push(amountMinor);
  if (amounts.length > 240) amounts.shift();
  world.caches.merchantAmounts.set(session.merchantId, amounts);
}

/** The stand-in issuer behind an acquirer: it approves as often as the acquirer's approval rate, deterministically by session. */
function standInIssuer(sessionId: string, acquirerId: string): 'approve' | 'decline' | 'insufficient_funds' {
  // Salted, so that the issuer's answer does not follow the routing, which hashes the same session id.
  const seed = `issuer:${acquirerId}:${sessionId}`;
  let h = 2_166_136_261;
  for (let i = 0; i < seed.length; i += 1) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16_777_619); }
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
  const point = (h >>> 0) % 10_000;
  const rate = acquirers.find((a) => a.id === acquirerId)?.approvalBps ?? 9_000;
  if (point < rate) return 'approve';
  return point % 5 < 2 ? 'insufficient_funds' : 'decline';
}
