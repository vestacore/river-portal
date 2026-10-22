import type { PspFact } from '@river/psp-facts';
import type { World } from './types/World.ts';

/** The unit a fact concerns: named in its payload, or the unit of the order, invoice, session or payment it names. */
export function unitOfFact(world: World, fact: PspFact): string | null {
  const p = fact.payload as Record<string, unknown>;
  if (typeof p.unitId === 'string') return p.unitId;
  if (typeof p.storeId === 'string') return p.storeId;
  if (typeof p.batchId === 'string' && fact.stream.startsWith('stl_')) { const b = world.views.settlements.get(p.batchId); if (b) return b.storeId ?? b.merchantId; if (typeof p.merchantId === 'string') return p.merchantId; }
  if (typeof p.sessionId === 'string') { const s = world.views.sessions.get(p.sessionId); if (s) return s.unitId; }
  if (typeof p.paymentId === 'string') { const x = world.views.payments.get(p.paymentId); if (x) return x.unitId; }
  if (typeof p.invoiceId === 'string') { const x = world.views.invoices.get(p.invoiceId); if (x) return x.unitId; }
  if (typeof p.orderId === 'string') { const x = world.views.orders.get(p.orderId); if (x) return x.unitId; }
  return null;
}
