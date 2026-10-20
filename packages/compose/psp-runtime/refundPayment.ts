import { formatMoney } from '@river/i18n';
import { refundableMinor, refundReasonText } from '@river/psp-payment';
import { reverseShares } from '@river/psp-split';
import { policyValue } from '@river/psp-units';
import { appendFacts } from './appendFacts.ts';
import { effectiveFor } from './effectiveFor.ts';
import { guard } from './guard.ts';
import { newId } from './newId.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

const day = 86_400_000;

/**
 * Gives money back: the door asks (`refund.Requested`), the stand-in acquirer returns it (`refund.Completed`)
 * from the shares that received it, in proportion; the PSP keeps its fee. Refused beyond what is refundable
 * or after the unit's refund window.
 */
export function refundPayment(world: World, actor: Actor, paymentId: string, amountMinor: number, reason: string, at: string): CommandResult<{ refundId: string }> {
  const payment = world.views.payments.get(paymentId);
  if (!payment) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'payments.refund', payment.unitId, at);
  if (denied) return { ok: false, error: denied };
  if (!Number.isInteger(amountMinor) || amountMinor <= 0 || amountMinor > refundableMinor(payment)) return { ok: false, error: 'over_refundable' };
  const window = Number(policyValue(effectiveFor(world, payment.unitId), 'refunds.window.days') ?? 180);
  if (payment.capturedAt && Date.parse(at) - Date.parse(payment.capturedAt) > window * day) return { ok: false, error: 'refund_window_passed' };
  const refundId = newId(world, 'rf');
  const by = actor.kind === 'person' ? actor.personId : 'merchant';
  appendFacts(world, paymentId, [{ type: 'refund.Requested', payload: { paymentId, refundId, amountMinor, currency: payment.currency, reason, by } }], { via: 'door', actor: by, role: actor.kind === 'person' ? actor.role : 'merchant' }, at);
  const shares = reverseShares(payment.allocations, amountMinor);
  appendFacts(world, paymentId, [{ type: 'refund.Completed', payload: { paymentId, refundId, invoiceId: payment.invoiceId, orderId: payment.orderId, acquirer: payment.acquirer, amountMinor, currency: payment.currency, allocations: shares } }], { via: 'world', controller: payment.acquirer, answering: null }, at);
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: payment.unitId, action: 'payment.refund', target: paymentId, detail: { 'en-GB': `Refunded ${formatMoney(amountMinor, payment.currency, 'en-GB')}: ${refundReasonText(reason)['en-GB']}`, uk: `Повернув ${formatMoney(amountMinor, payment.currency, 'uk')}: ${refundReasonText(reason).uk}` }, at });
  return { ok: true, value: { refundId } };
}
