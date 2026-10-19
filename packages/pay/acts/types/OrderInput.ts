import type { Currency } from '@river/pay-facts';

/** A merchant's order after validation: what is asked for, how much, in what currency, from whom. */
export type OrderInput = {
  title: string;
  amountMinor: number;
  currency: Currency;
  payerRef: string;
};
