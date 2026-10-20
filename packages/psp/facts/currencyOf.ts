import { currencies, type Currency } from './types/Currency.ts';

/** A currency code checked against the ones the PSP carries; throws for any other. */
export function currencyOf(code: string): Currency {
  if (!(currencies as readonly string[]).includes(code)) throw new Error(`Currency ${code} is not carried`);
  return code as Currency;
}
