import type { World } from '@river/psp-runtime';
import type { SessionView } from '@river/psp-session';

/**
 * When an attempt was held, and when its hold was decided — read from the session's own stream: the
 * bridge that stopped it (the screening's `review.Opened`, or money that did not match) and the officer's
 * `review.Cleared` or `review.Rejected`. The view keeps the decision, not its moment.
 */
export function heldAt(w: World, s: SessionView): string {
  return w.streams.get(s.sessionId)?.findLast((f) => f.type === 'review.Opened' || f.type === 'funds.Mismatched')?.at ?? s.updatedAt;
}

export function reviewDecidedAt(w: World, s: SessionView): string {
  return w.streams.get(s.sessionId)?.findLast((f) => f.type === 'review.Cleared' || f.type === 'review.Rejected')?.at ?? s.updatedAt;
}
