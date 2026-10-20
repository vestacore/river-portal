import { appendFacts } from './appendFacts.ts';
import type { World } from './types/World.ts';

/** A reminder goes out for an invoice — by policy, or on a person's decision about the Collector's proposal. */
export function remindInvoice(world: World, invoiceId: string, step: number, channel: 'email' | 'sms' | 'messenger', decidedBy: string, at: string): boolean {
  const invoice = world.views.invoices.get(invoiceId);
  if (!invoice || invoice.voided || invoice.paidMinor >= invoice.amountMinor) return false;
  appendFacts(world, invoiceId, [{ type: 'invoice.Reminded', payload: { invoiceId, step, channel, decidedBy } }], { via: 'figure', by: 'collector' }, at);
  return true;
}
