import type { GiftKind } from './GiftKind.ts';
import type { GiftStatus } from './GiftStatus.ts';
import type { GiverDisplay } from './GiverDisplay.ts';

/** Team view of a gift (`orgs/{org}/gifts/{id}`). Amounts are private to the giver and team. */
export type Gift = {
  id: string;
  kind: GiftKind;
  status: GiftStatus;
  amountMinor: number | null;
  currency: string | null;
  description: string;
  campaignId: string | null;
  flowId: string | null;
  giverDisplay: GiverDisplay;
  displayName: string | null;
  pledgedAt: string;
  updatedAt: string;
};
