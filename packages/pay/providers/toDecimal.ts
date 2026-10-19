/** Minor units as a decimal string with two places ("12000" → "120.00"), for providers that want one. */
export function toDecimal(amountMinor: number): string {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) throw new Error(`Not an amount in minor units: ${amountMinor}`);
  return `${Math.floor(amountMinor / 100)}.${String(amountMinor % 100).padStart(2, '0')}`;
}
