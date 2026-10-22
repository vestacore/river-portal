import { randomBytes } from 'node:crypto';
import { activeTariffOf } from '@river/psp-contracts';
import type { Channel, OrderLine } from '@river/psp-facts';
import { planForUnit } from '@river/psp-flow';
import { orderTotal, validateOrderLines } from '@river/psp-order';
import { policyValue, resolvePolicy, findPolicyDefinition } from '@river/psp-units';
import type { Origin } from '@river/stream';
import { appendFacts } from './appendFacts.ts';
import { effectiveFor } from './effectiveFor.ts';
import { hashKey } from './hashKey.ts';
import { merchantOf } from './merchantOf.ts';
import { newId } from './newId.ts';
import type { World } from './types/World.ts';

const day = 86_400_000;

/**
 * An order and its invoice, as one door gesture: `order.Created` in the order's stream with the split plan
 * the unit's policies give it, then `invoice.Issued` in the invoice's own stream, with the hash of a new
 * pay key. Refused above the unit's payment limit, for a unit that cannot trade yet, and for a merchant
 * without an active contract — approval at onboarding is not enough: what a payment costs must be agreed
 * (the PSP's tariff, or the merchant's own acquiring terms where acquirers settle to it directly).
 */
export function placeOrder(world: World, input: { unitId: string; channel: Channel; lines: OrderLine[]; payerRef: string; reference?: string; dueDays?: number; allowPartial?: boolean; send?: 'email' | 'sms' | 'messenger' | 'link' | 'qr' | null }, origin: Origin, at: string): { orderId: string; invoiceId: string; payKey: string } | { error: string } {
  const unit = world.units.find((u) => u.id === input.unitId);
  if (!unit) return { error: 'unknown unit' };
  const merchantId = merchantOf(world, unit.id);
  const merchant = world.units.find((u) => u.id === merchantId);
  if (!merchant || merchant.status !== 'active' || unit.status === 'suspended') return { error: 'the merchant cannot take payments yet' };
  const errors = validateOrderLines(input.lines);
  if (errors.length > 0) return { error: errors.join('; ') };
  const effective = effectiveFor(world, unit.id);
  // Where the platform holds the money its tariff must be agreed; where acquirers settle directly, the
  // merchant must have acquiring terms with at least one of them.
  const direct = policyValue(effective, 'settlement.model') === 'direct';
  if (direct ? !world.acquiring.some((t) => t.merchantId === merchantId) : !activeTariffOf(world.contracts, world.tariffs, merchantId, at)) return { error: 'the merchant has no active contract' };
  const total = orderTotal(input.lines);
  const limit = policyValue(effective, 'limits.payment.max');
  if (typeof limit === 'number' && total > limit) return { error: 'over the unit’s payment limit' };
  const template = resolvePolicy(world.units, world.settings, unit.id, findPolicyDefinition('split.template'));
  const split = planForUnit({ merchantUnitId: merchantId, pspUnitId: direct ? 'acq:*' : world.feeRecipient ?? 'acq:*', feeRole: direct ? 'acquirer_fee' : 'psp_fee', lines: input.lines, effective, franchisorUnitId: template.value === 'franchise' ? template.source : null });
  const orderId = newId(world, 'ord');
  const invoiceId = newId(world, 'inv');
  const payKey = randomBytes(12).toString('base64url');
  const year = at.slice(0, 4);
  const number = `${unit.code.split('-')[0]}-${year}-${String((world.counters[`no-${merchantId}`] = (world.counters[`no-${merchantId}`] ?? 0) + 1)).padStart(5, '0')}`;
  appendFacts(world, orderId, [{ type: 'order.Created', payload: {
    orderId, unitId: unit.id, merchantId, reference: input.reference ?? number, channel: input.channel, currency: merchant.currency, lines: input.lines, totalMinor: total,
    payerRef: input.payerRef, split, captureMode: policyValue(effective, 'capture.mode') === 'manual' ? 'manual' : 'auto',
  } }], origin, at);
  // A checkout's invoice lives a day; one sent for payment by terms lives as long as the unit's policy says.
  const dueDays = input.dueDays ?? (input.channel === 'invoice' || input.channel === 'subscription' ? Number(policyValue(effective, 'invoices.dueDays') ?? 7) : 1);
  appendFacts(world, invoiceId, [
    { type: 'invoice.Issued', payload: { invoiceId, orderId, unitId: unit.id, merchantId, number, amountMinor: total, currency: merchant.currency, dueAt: new Date(Date.parse(at) + dueDays * day).toISOString(), allowPartial: input.allowPartial ?? false, payKeyHash: hashKey(payKey) } },
    ...(input.send ? [{ type: 'invoice.Sent' as const, payload: { invoiceId, channel: input.send } }] : []),
  ], origin, at);
  world.payKeys[invoiceId] = payKey;
  return { orderId, invoiceId, payKey };
}
