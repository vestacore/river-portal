export const feedItemStatuses = ['suggested', 'published', 'rejected', 'withdrawn'] as const;
export type FeedItemStatus = (typeof feedItemStatuses)[number];
