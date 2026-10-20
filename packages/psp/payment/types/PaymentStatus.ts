/** Where a payment stands. `authorised` and `received` are funds secured but not yet taken. */
export const paymentStatuses = ['authorised', 'received', 'captured', 'partially_refunded', 'refunded', 'disputed', 'chargeback', 'voided', 'expired'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];
