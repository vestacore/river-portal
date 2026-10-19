import type { AttemptState } from './AttemptState.ts';

/**
 * What the point of cancellation holds: how often a cancellation was asked for and decided, the
 * last request with who made it, and everything a decision depends on — the attempts, and whether
 * the order is already paid, flagged or withdrawn.
 */
export type CancelState = AttemptState & {
  asked: number;
  decided: number;
  last: { reason: string; unless: 'collecting' | 'underWay'; by: string } | null;
  paid: boolean;
  flagged: boolean;
  cancelled: boolean;
};
