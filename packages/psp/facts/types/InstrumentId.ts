/** Payment instruments. Every one is a first-class citizen: same river, same projections, its own bridges. */
export const instrumentIds = [
  'card', 'apple_pay', 'google_pay', 'pay_by_bank', 'bank_transfer', 'qr_nbu',
  'installments', 'bnpl', 'wallet', 'stablecoin', 'voucher', 'direct_debit',
] as const;
export type InstrumentId = (typeof instrumentIds)[number];

/** The rail that carries an instrument's money. */
export const rails = ['card', 'wallet', 'a2a', 'transfer', 'qr', 'credit', 'chain', 'cash', 'debit'] as const;
export type Rail = (typeof rails)[number];
