import type { Allocation } from '@river/psp-facts';

/**
 * Whose shares give back a refund (or a lost dispute): every share except the PSP's fee, in proportion to
 * what it received, rounded down. The merchant's share — the one that took the remainder — also carries
 * the rounding and, on a full refund, the fee the PSP keeps: its balance may go below zero, never the
 * payer's money. Amounts are negative: they are taken back from each stream of the delta.
 */
export function reverseShares(allocations: readonly Allocation[], returnedMinor: number): Allocation[] {
  // Neither the PSP nor the acquirer gives its fee back on a refund; the merchant's side carries it.
  const giving = allocations.filter((a) => a.role !== 'psp_fee' && a.role !== 'acquirer_fee' && a.amountMinor > 0);
  const base = giving.reduce((s, a) => s + a.amountMinor, 0);
  const total = allocations.reduce((s, a) => s + Math.max(0, a.amountMinor), 0);
  if (returnedMinor > total) throw new Error(`Cannot give back ${returnedMinor} of ${total}`);
  if (giving.length === 0 || returnedMinor === 0) return [];
  const proportional = Math.min(returnedMinor, base);
  const parts = giving.map((a) => Math.floor((a.amountMinor * proportional) / base));
  const owner = giving.findIndex((a) => a.role === 'merchant' || a.role === 'platform');
  const carrier = owner >= 0 ? owner : giving.reduce((best, a, i) => (a.amountMinor > giving[best]!.amountMinor ? i : best), 0);
  parts[carrier]! += returnedMinor - parts.reduce((s, p) => s + p, 0);
  return giving.map((a, i) => ({ ...a, amountMinor: -parts[i]!, holdUntil: null })).filter((a) => a.amountMinor !== 0);
}
