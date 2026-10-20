import type { PspFact } from '@river/psp-facts';
import type { World } from '@river/psp-runtime';

/**
 * The fact an event id names: `evt_<stream>_<seq>` is one fact of one stream, so the id is enough to find
 * it again. A test event names no fact of the river, and an id the world does not know gives null.
 */
export function factOfEvent(w: World, eventId: string): PspFact | null {
  const match = /^evt_(.+)_(\d+)$/.exec(eventId);
  if (!match) return null;
  const fact = w.streams.get(match[1]!)?.[Number(match[2])];
  return fact && fact.seq === Number(match[2]) ? fact : null;
}

/** The unit a fact concerns: named in its payload, or the unit of the session, payment, invoice or order it names. */
export function unitOfFact(w: World, fact: PspFact): string | null {
  const p = fact.payload as Record<string, unknown>;
  if (typeof p.unitId === 'string') return p.unitId;
  if (typeof p.sessionId === 'string') { const s = w.views.sessions.get(p.sessionId); if (s) return s.unitId; }
  if (typeof p.paymentId === 'string') { const x = w.views.payments.get(p.paymentId); if (x) return x.unitId; }
  if (typeof p.invoiceId === 'string') { const x = w.views.invoices.get(p.invoiceId); if (x) return x.unitId; }
  if (typeof p.orderId === 'string') { const x = w.views.orders.get(p.orderId); if (x) return x.unitId; }
  return null;
}

/** The unit of a stream, through its view: a session's or a payment's, an invoice's or an order's. */
export function unitOfStream(w: World, stream: string): string | null {
  if (stream.startsWith('ps_')) return w.views.sessions.get(stream)?.unitId ?? null;
  if (stream.startsWith('pay_')) return w.views.payments.get(stream)?.unitId ?? null;
  if (stream.startsWith('inv_')) return w.views.invoices.get(stream)?.unitId ?? null;
  if (stream.startsWith('ord_')) return w.views.orders.get(stream)?.unitId ?? null;
  return null;
}

/** Where a stream is read in the cabinet: a session's bridge, or the page of a payment, invoice or order. */
export function pathOfStream(stream: string, seq?: number): string {
  if (stream.startsWith('ps_')) return `/sessions/${stream}${seq !== undefined ? `#b-${seq}` : ''}`;
  if (stream.startsWith('pay_')) return `/payments/${stream}`;
  if (stream.startsWith('inv_')) return `/invoices/${stream}`;
  return `/orders/${stream}`;
}
