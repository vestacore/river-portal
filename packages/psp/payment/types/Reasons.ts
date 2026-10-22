/**
 * Why money goes back, as a code a cabinet offers and every language can name. A reason given in a
 * person's own words is kept as typed (`other` stands for it in reports).
 */
export const refundReasons = ['requested_by_customer', 'returned', 'damaged', 'not_delivered', 'picked_less', 'duplicate', 'cancelled', 'other'] as const;
export type RefundReason = (typeof refundReasons)[number];
