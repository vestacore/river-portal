import type { Currency } from '@river/psp-facts';
import type { PaymentView } from '@river/psp-payment';
import { daysBack } from './daysBack.ts';
import type { DayPoint } from './types/Views.ts';

/** Captured volume per day in one currency, over the last `days` days. */
export function volumeByDay(payments: readonly PaymentView[], currency: Currency, days: number, now: string): DayPoint[] {
  const totals = new Map(daysBack(days, now).map((d) => [d, 0]));
  for (const p of payments) {
    if (p.currency !== currency || !p.capturedAt) continue;
    const day = p.capturedAt.slice(0, 10);
    if (totals.has(day)) totals.set(day, totals.get(day)! + p.capturedMinor);
  }
  return [...totals.entries()].map(([day, value]) => ({ day, value }));
}
