import type { Identity } from './types/Identity.ts';
import type { Role } from './types/Role.ts';

/** True when the identity holds at least one of the roles. */
export function hasRole(identity: Identity | null | undefined, ...wanted: Role[]): boolean {
  return !!identity && identity.roles.some((r) => wanted.includes(r));
}
