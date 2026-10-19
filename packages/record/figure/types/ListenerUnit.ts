import type { Doc } from '@river/store';
import type { Fact } from '@river/stream';

/** A listener as the wave sees it: its state is a plain document. Made by `defineListener`. */
export type ListenerUnit = {
  id: string;
  hears: readonly string[];
  init: Doc;
  step: (state: Doc, fact: Fact) => Doc;
  ready: (state: Doc) => boolean;
};
