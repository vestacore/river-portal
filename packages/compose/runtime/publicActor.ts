import type { Actor } from '@river/log';

/** A member of the public acting through the website (no account). */
export function publicActor(role: 'recipient' | 'giver' | 'anonymous' = 'anonymous'): Actor {
  return { personId: null, role, via: 'web' };
}
