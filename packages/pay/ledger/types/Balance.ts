import type { Currency } from '@river/pay-facts';

/** The net position of one account in one currency: debits minus credits, in minor units. */
export type Balance = {
  account: string;
  currency: Currency;
  balanceMinor: number;
};
