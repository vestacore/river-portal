/**
 * The platform's commission on an amount, in minor units: `feeBps` hundredths of a per cent,
 * rounded half up. Integer arithmetic only — money is never a float.
 */
export function feeMinor(amountMinor: number, feeBps: number): number {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) throw new Error(`Amount must be a non-negative integer of minor units, got ${amountMinor}`);
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) throw new Error(`Fee must be 0–10000 basis points, got ${feeBps}`);
  return Math.floor((amountMinor * feeBps + 5_000) / 10_000);
}
