import type { InstrumentId } from '@river/psp-facts';
import type { Tariff } from './types/Contract.ts';

/**
 * The PSP's fee for one payment under a tariff: the instrument's rate (or the fallback), `bps` hundredths
 * of a per cent rounded half up, plus the fixed part, at least the minimum, never more than the amount.
 * Integer arithmetic only. It is stated in the invoice before anyone pays and taken at the capture.
 */
export function feeFor(tariff: Tariff, instrument: InstrumentId, amountMinor: number): number {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) throw new Error(`Amount must be whole minor units, got ${amountMinor}`);
  const rate = tariff.rates[instrument] ?? tariff.fallback;
  const fee = Math.floor((amountMinor * rate.bps + 5_000) / 10_000) + rate.fixedMinor;
  return Math.min(amountMinor, Math.max(rate.minMinor, fee));
}
