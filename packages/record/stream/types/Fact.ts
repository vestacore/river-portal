import type { Origin } from './Origin.ts';

/**
 * One immutable record of a stream. `seq` is dense and starts at 0, so the order of a stream is total;
 * `wave` numbers the fragment the fact was written in, and `causedBy` is the fact whose propagation
 * (or whose answer) produced it — null for a fact that entered from outside.
 * `type` follows `aggregate.PastTense`. Payloads hold no plaintext personal or card data.
 */
export type Fact<P extends Record<string, unknown> = Record<string, unknown>> = {
  stream: string;
  seq: number;
  type: string;
  payload: P;
  origin: Origin;
  wave: number;
  causedBy: number | null;
  at: string;
};
