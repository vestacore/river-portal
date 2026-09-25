import type { GiftKind } from './GiftKind.ts';
import type { GiverDisplay } from './GiverDisplay.ts';

export type PledgeInput = {
  kind: GiftKind;
  amountMinor: number | null;
  description: string;
  campaignId: string | null;
  name: string;
  email: string;
  giverDisplay: GiverDisplay;
  /** Set by the application from a signed-in giver's identity, never from the form. */
  giverId?: string | null;
};
