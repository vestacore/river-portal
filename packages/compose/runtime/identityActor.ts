import type { Identity, Role } from '@river/identity';
import type { Actor } from '@river/log';

/**
 * The log actor for an identity, acting in one `capacity` (a role they hold; by default their
 * first), with staff actions marked as coming from the studio. The capacity is what the audit shows.
 */
export function identityActor(identity: Identity, surface: 'web' | 'studio', capacity?: Role): Actor {
  const role = capacity && identity.roles.includes(capacity) ? capacity : (identity.roles[0] ?? 'anonymous');
  return { personId: identity.personId, role, via: surface, label: identity.email ?? identity.name };
}
