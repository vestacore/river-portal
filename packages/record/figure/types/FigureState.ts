import type { Doc } from '@river/store';

/**
 * The state of the listeners and the latches of the joiners for one stream, as of `upToSeq`.
 * A cache, never a truth: replaying the stream rebuilds it exactly (`rebuildState`).
 */
export type FigureState = {
  upToSeq: number;
  listeners: Record<string, Doc>;
  fired: Record<string, number>;
};
