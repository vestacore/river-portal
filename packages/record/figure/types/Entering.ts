import type { FactDraft, Origin } from '@river/stream';

/** A draft on its way into a stream, with who gives it and what it answers or follows from. */
export type Entering = {
  draft: FactDraft;
  origin: Origin;
  causedBy: number | null;
};
