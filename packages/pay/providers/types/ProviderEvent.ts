import type { FactDraft } from '@river/stream';

/** A provider's webhook, read as facts for one order. `eventId` makes the entry idempotent. */
export type ProviderEvent = {
  orderId: string;
  eventId: string;
  drafts: FactDraft[];
};
