import { testCards } from './data/testCards.ts';
import type { TestCard } from './types/Checkout.ts';

/** The demo test card a number is, or null — the stand-in issuer knows no other. */
export function testCardOf(input: string): TestCard | null {
  const digits = input.replace(/\D/g, '');
  return testCards.find((c) => c.number === digits) ?? null;
}
