/** Currencies the PSP carries. All have two minor digits, so every `…Minor` amount is in hundredths. */
export const currencies = ['UAH', 'EUR', 'USD', 'PLN', 'GBP'] as const;
export type Currency = (typeof currencies)[number];
