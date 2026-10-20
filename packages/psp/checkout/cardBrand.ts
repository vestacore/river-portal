import type { CardBrand } from './types/Checkout.ts';

/** The brand of a card number from its first digits, or null. ПРОСТІР is the Ukrainian national scheme (9804…). */
export function cardBrand(input: string): CardBrand | null {
  const d = input.replace(/\D/g, '');
  if (/^9804/.test(d)) return 'prostir';
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  return null;
}
