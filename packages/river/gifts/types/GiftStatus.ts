export const giftStatuses = ['pledged', 'received', 'allocated', 'delivered', 'acknowledged'] as const;
export type GiftStatus = (typeof giftStatuses)[number];
