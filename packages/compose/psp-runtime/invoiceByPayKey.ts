import type { InvoiceView } from '@river/psp-invoice';
import { hashKey } from './hashKey.ts';
import type { World } from './types/World.ts';

/** The invoice a pay key opens, or null. The key is the payer's authority; only its hash is compared. */
export function invoiceByPayKey(world: World, payKey: string): InvoiceView | null {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(payKey)) return null;
  const hash = hashKey(payKey);
  for (const invoice of world.views.invoices.values()) if (invoice.payKeyHash === hash) return invoice;
  return null;
}
