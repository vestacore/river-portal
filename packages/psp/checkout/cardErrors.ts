import { cardBrand } from './cardBrand.ts';
import { testCards } from './data/testCards.ts';
import { luhnValid } from './luhnValid.ts';
import type { CardError } from './types/Checkout.ts';

/**
 * What is wrong with a card form, in the order a payer should fix it — the number, then the expiry, then
 * the code. In the demo, only the listed test cards pass: any other number is refused here, in the browser.
 */
export function cardErrors(form: { number: string; expiry: string; cvc: string }, now: Date): CardError[] {
  const errors: CardError[] = [];
  const digits = form.number.replace(/\D/g, '');
  const brand = cardBrand(digits);
  if (digits.length < 16 && !(brand === 'amex' && digits.length === 15)) errors.push('number_incomplete');
  else if (!luhnValid(digits)) errors.push('number_invalid');
  else if (!brand) errors.push('brand_unsupported');
  else if (!testCards.some((c) => c.number === digits)) errors.push('not_a_test_card');
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(form.expiry.trim());
  if (!m) errors.push('expiry_incomplete');
  else {
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    const endOfMonth = new Date(Date.UTC(year, month, 1));
    if (month < 1 || month > 12 || endOfMonth <= now) errors.push('expiry_invalid');
  }
  if (!/^\d{3,4}$/.test(form.cvc) || (brand === 'amex' ? form.cvc.length !== 4 : form.cvc.length !== 3)) errors.push('cvc_incomplete');
  return errors;
}
