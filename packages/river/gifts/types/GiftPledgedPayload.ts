import type { GiftKind } from './GiftKind.ts';
import type { GiverDisplay } from './GiverDisplay.ts';

/** Payload of `gift.Pledged` (visibility `team`). */
export type GiftPledgedPayload = {
  kind: GiftKind;
  amountMinor: number | null;
  currency: string | null;
  description: string;
  campaignId: string | null;
  giverDisplay: GiverDisplay;
  displayName: string | null;
};
