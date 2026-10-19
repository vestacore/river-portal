/** Currencies the payment river carries. All have two minor digits, so `amountMinor` is in hundredths. */
export const currencies = ['EUR', 'USD', 'GBP', 'UAH'] as const;
export type Currency = (typeof currencies)[number];
