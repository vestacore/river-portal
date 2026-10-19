/**
 * An intention that waits at a bank, as an operator reads it: which bank, which order and fact, how
 * often it was tried and what went wrong last. `stale` marks one that has waited longer than a
 * working messaging layer would leave it.
 */
export type WaitingIntention = {
  controller: string;
  stream: string;
  seq: number;
  type: string;
  attempts: number;
  lastError: string | null;
  at: string;
  stale: boolean;
};
