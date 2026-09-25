import type { SiteDoc } from './types/SiteDoc.ts';

/** A site document before anything has happened. */
export function emptySiteDoc(orgId: string, at: string): SiteDoc {
  return {
    orgId,
    counters: { needsReceived: 0, needsConfirmed: 0, households: 0, deliveries: 0, giftsPledged: 0, moneyReceivedMinor: 0, costsMinor: 0, costBreakdown: {}, gratitudeNotes: 0, lastConfirmedAt: null },
    campaigns: [], feed: [], reports: [], gratitude: [], blocks: {}, updatedAt: at,
  };
}
