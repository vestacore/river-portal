import type { SiteDoc } from './types/SiteDoc.ts';

/** A site document before anything has happened. */
export function emptySiteDoc(orgId: string, at: string): SiteDoc {
  return {
    orgId,
    counters: { needsReceived: 0, needsConfirmed: 0, households: 0, deliveries: 0, giftsPledged: 0, moneyReceivedGbpMinor: 0, costsGbpMinor: 0, gratitudeNotes: 0 },
    campaigns: [], feed: [], reports: [], gratitude: [], blocks: {}, updatedAt: at,
  };
}
