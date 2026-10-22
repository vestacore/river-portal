import { issuers } from './data/issuers.ts';
import type { CardProduct, CardScheme, Issuer } from './types/Issuer.ts';

/** The issuer of a card by its BIN — the longest range it falls in — or null for a bank the directory does not know. */
export function issuerOfBin(bin: string | undefined): { issuer: Issuer; scheme: CardScheme; product: CardProduct } | null {
  if (!bin) return null;
  let best: { issuer: Issuer; scheme: CardScheme; product: CardProduct; length: number } | null = null;
  for (const issuer of issuers) {
    for (const range of issuer.bins) {
      if (bin.startsWith(range.prefix) && (!best || range.prefix.length > best.length)) best = { issuer, scheme: range.scheme, product: range.product, length: range.prefix.length };
    }
  }
  return best ? { issuer: best.issuer, scheme: best.scheme, product: best.product } : null;
}
