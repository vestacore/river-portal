/** A fee as a share of the amount it was taken on, in basis points (fractional, for a percentage with two decimals); 0 when there is no amount. */
export function rateBps(feeMinor: number, amountMinor: number): number {
  return amountMinor > 0 ? (feeMinor / amountMinor) * 10_000 : 0;
}
