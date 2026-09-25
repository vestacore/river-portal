/** One step a recipient sees on their tracking page, in plain words chosen by `code`. */
export type TimelineCode =
  | 'submitted' | 'acknowledged' | 'triaged' | 'matched' | 'dispatched' | 'delivered' | 'confirmed' | 'closed';

export type TimelineEntry = { at: string; code: TimelineCode };
