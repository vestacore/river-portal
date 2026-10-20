import type { Grant } from './types/Access.ts';

/** A person's profiles: their active grants, the widest first (by the order they were granted). */
export function scopesOf(grants: readonly Grant[], personId: string, now: string): Grant[] {
  return grants.filter((g) => g.personId === personId && g.status === 'active' && (g.expiresAt === null || g.expiresAt > now));
}
