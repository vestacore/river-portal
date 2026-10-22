import type { Channel } from '@river/psp-facts';
import { invoiceStatusAt } from '@river/psp-invoice';
import { isSessionClosed } from '@river/psp-session';
import { policyValue } from '@river/psp-units';
import { appendFacts } from './appendFacts.ts';
import { effectiveFor } from './effectiveFor.ts';
import { newId } from './newId.ts';
import type { World } from './types/World.ts';

/**
 * The source of a river: the payer opens the pay page of an invoice and an attempt begins. An attempt
 * already under way is continued instead of opening a second one beside it. A paid, voided or expired
 * invoice opens nothing. An attempt may pay part of what is due — bonus points, for one, pay a part and
 * another instrument the rest.
 */
export function startSession(world: World, invoiceId: string, ctx: { channel: Channel; locale: string; country: string; payerHandle: string; amountMinor?: number }, at: string): { sessionId: string } | { error: string } {
  const invoice = world.views.invoices.get(invoiceId);
  if (!invoice) return { error: 'not_found' };
  const status = invoiceStatusAt(invoice, at);
  if (status === 'paid' || status === 'void' || status === 'refunded' || status === 'partially_refunded') return { error: 'not_payable' };
  const open = invoice.sessionIds.map((id) => world.views.sessions.get(id)).find((s) => s && !isSessionClosed(s) && s.expiresAt > at);
  if (open) return { sessionId: open.sessionId };
  const minutes = Number(policyValue(effectiveFor(world, invoice.unitId), 'checkout.session.minutes') ?? 30);
  const sessionId = newId(world, 'ps');
  const door = { via: 'door' as const, actor: ctx.payerHandle, role: 'payer' };
  appendFacts(world, sessionId, [{ type: 'session.Opened', payload: {
    sessionId, invoiceId, orderId: invoice.orderId, unitId: invoice.unitId, merchantId: invoice.merchantId, amountMinor: Math.min(ctx.amountMinor ?? invoice.amountMinor - invoice.paidMinor, invoice.amountMinor - invoice.paidMinor),
    currency: invoice.currency, channel: ctx.channel, locale: ctx.locale, country: ctx.country, expiresAt: new Date(Date.parse(at) + minutes * 60_000).toISOString(),
  } }], door, at);
  appendFacts(world, invoiceId, [{ type: 'invoice.Viewed', payload: { invoiceId } }], door, at);
  return { sessionId };
}
