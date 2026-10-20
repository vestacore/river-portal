import { appendFacts } from './appendFacts.ts';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** The merchant withdraws an unpaid invoice — and, with it, the order nobody paid. */
export function voidInvoice(world: World, actor: Actor, invoiceId: string, reason: string, at: string): CommandResult {
  const invoice = world.views.invoices.get(invoiceId);
  if (!invoice) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'orders.write', invoice.unitId, at);
  if (denied) return { ok: false, error: denied };
  if (invoice.voided || invoice.paidMinor > 0) return { ok: false, error: 'not_voidable' };
  const by = actor.kind === 'person' ? actor.personId : 'merchant';
  const door = { via: 'door' as const, actor: by, role: actor.kind === 'person' ? actor.role : 'merchant' };
  appendFacts(world, invoiceId, [{ type: 'invoice.Voided', payload: { invoiceId, orderId: invoice.orderId, reason, by } }], door, at);
  appendFacts(world, invoice.orderId, [{ type: 'order.Cancelled', payload: { orderId: invoice.orderId, reason, by } }], door, at);
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: invoice.unitId, action: 'invoice.void', target: invoiceId, detail: { 'en-GB': `Voided: ${reason}`, uk: `Анульовано: ${reason}` }, at });
  return { ok: true, value: { invoiceId } };
}
