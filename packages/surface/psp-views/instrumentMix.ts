import type { Currency, InstrumentId } from '@river/psp-facts';
import type { PaymentView } from '@river/psp-payment';

/** Captured payments by instrument in one currency: how many and how much, the largest first. */
export function instrumentMix(payments: readonly PaymentView[], currency: Currency): Array<{ instrument: InstrumentId; count: number; amountMinor: number }> {
  const mix = new Map<InstrumentId, { instrument: InstrumentId; count: number; amountMinor: number }>();
  for (const p of payments) {
    if (p.currency !== currency || p.capturedMinor === 0) continue;
    const m = mix.get(p.instrument) ?? { instrument: p.instrument, count: 0, amountMinor: 0 };
    m.count += 1;
    m.amountMinor += p.capturedMinor;
    mix.set(p.instrument, m);
  }
  return [...mix.values()].sort((a, b) => b.amountMinor - a.amountMinor);
}
