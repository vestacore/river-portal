/** What is given (spec: Gift). A gift is never a purchase. */
export const giftKinds = ['money', 'goods', 'transport', 'service', 'time'] as const;
export type GiftKind = (typeof giftKinds)[number];
