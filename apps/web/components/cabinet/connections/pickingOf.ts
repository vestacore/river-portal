import type { OrderLine } from '@river/psp-facts';
import type { OrderView } from '@river/psp-order';
import type { World } from '@river/psp-runtime';

/** What picking changed in one order and what the money did around it. */
export type PickingFigures = {
  pickedAt: string | null;
  orderedMinor: number;
  pickedMinor: number;
  changes: Array<{ sku: string; title: OrderLine['title']; kind: 'weight' | 'missing' | 'substitute'; deltaMinor: number }>;
  /** True when the order system sent the picked lines without naming the changes, and they were read from the lines. */
  changesDerived: boolean;
  invoices: Array<{ invoiceId: string; number: string; originalMinor: number | null; amountMinor: number }>;
  /** Authorised on the order's holds (manual capture), bonus points aside. */
  holdMinor: number;
  /** Still held, waiting for the capture. */
  heldNowMinor: number;
  /** Captured on every payment of the order but the bonus points. */
  capturedMinor: number;
  /** Released: the rest of each hold after a partial capture, and holds released or lapsed in full. */
  releasedMinor: number;
  /** Paid with bonus points, and how much of it went back to the payer's balance. */
  bonusMinor: number;
  bonusReturnedMinor: number;
  /** Given back because the order was paid in full before picking and picked for less. */
  refundedAfterPickingMinor: number;
  /** How the money met the picking: held and captured after it, paid after it, paid in full before it — or not paid at all. */
  course: 'held' | 'paid_after' | 'paid_before' | 'unpaid' | 'cancelled';
};

/**
 * The figures of capture after picking for one order, read from its views and from the facts that formed
 * it: the released rest is what each `capture.Completed` says it released, and a hold voided or lapsed in
 * full is released whole. When the order system names no change but the picked total differs, the
 * changes are read from the lines: a line gone is missing, a line whose total moved is weighed goods.
 * Null when the order system has not reported the picking.
 */
export function pickingOf(w: World, o: OrderView): PickingFigures | null {
  if (!o.picked) return null;
  const payments = o.paymentIds.map((id) => w.views.payments.get(id)).filter((p) => p !== undefined);
  const points = payments.filter((p) => p.instrument === 'bonus_points');
  const others = payments.filter((p) => p.instrument !== 'bonus_points');
  const holds = others.filter((p) => p.captureMode === 'manual');
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const pickedAt = o.timeline.find((e) => e.type === 'fulfilment.Picked')?.at ?? null;
  let releasedMinor = sum(holds.filter((p) => p.status === 'voided' || p.status === 'expired').map((p) => p.amountMinor));
  for (const entry of o.timeline) {
    if (entry.type !== 'capture.Completed') continue;
    const fact = w.streams.get(entry.stream)?.find((f) => f.seq === entry.seq);
    if (fact?.type === 'capture.Completed') releasedMinor += fact.payload.releasedMinor ?? 0;
  }
  const capturedBefore = pickedAt !== null && others.some((p) => p.capturedAt !== null && p.capturedAt < pickedAt);
  const course: PickingFigures['course'] = holds.length > 0 ? 'held' : capturedBefore ? 'paid_before' : others.some((p) => p.capturedMinor > 0) || points.length > 0 ? 'paid_after' : o.cancelled ? 'cancelled' : 'unpaid';
  const picked = o.picked;
  const changesDerived = picked.changes.length === 0 && picked.totalMinor !== o.totalMinor;
  type Change = (typeof picked.changes)[number];
  const changes: Change[] = !changesDerived ? picked.changes : [
    ...o.lines.flatMap((l): Change[] => {
      const now = picked.lines.find((x) => x.sku === l.sku);
      if (!now) return [{ sku: l.sku, kind: 'missing', deltaMinor: -l.totalMinor }];
      return now.totalMinor !== l.totalMinor ? [{ sku: l.sku, kind: 'weight', deltaMinor: now.totalMinor - l.totalMinor }] : [];
    }),
    ...picked.lines.filter((x) => !o.lines.some((l) => l.sku === x.sku)).map((x): Change => ({ sku: x.sku, kind: 'substitute', deltaMinor: x.totalMinor })),
  ];
  return {
    pickedAt,
    orderedMinor: o.totalMinor,
    pickedMinor: o.picked.totalMinor,
    changes: changes.map((c) => ({ ...c, title: o.lines.find((l) => l.sku === c.sku)?.title ?? picked.lines.find((l) => l.sku === c.sku)?.title ?? {} })),
    changesDerived,
    invoices: o.invoiceIds.map((id) => w.views.invoices.get(id)).filter((i) => i !== undefined).map((i) => ({ invoiceId: i.invoiceId, number: i.number, originalMinor: i.originalMinor, amountMinor: i.amountMinor })),
    holdMinor: sum(holds.map((p) => p.amountMinor)),
    heldNowMinor: sum(holds.map((p) => o.held[p.paymentId] ?? 0)),
    capturedMinor: sum(others.map((p) => p.capturedMinor)),
    releasedMinor,
    bonusMinor: sum(points.map((p) => p.capturedMinor)),
    bonusReturnedMinor: sum(points.map((p) => p.refundedMinor)),
    refundedAfterPickingMinor: sum(others.flatMap((p) => p.refunds.filter((r) => r.reason === 'picked_less' && r.status === 'completed').map((r) => r.amountMinor))),
    course,
  };
}
