import type { Fact } from '@river/stream';

/**
 * A point of need (NestVM: an activation knot). It declares what it hears, folds each heard fact
 * into its state with a pure step, and says when its need is met. It holds no state of its own:
 * the state is a value the wave hands in and takes back (adr/records/ADR-0025).
 */
export type Listener<S> = {
  id: string;
  hears: readonly string[];
  init: S;
  step: (state: S, fact: Fact) => S;
  ready: (state: S) => boolean;
};
