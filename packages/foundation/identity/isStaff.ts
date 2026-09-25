import { staffRoles, type Role } from './types/Role.ts';
import type { Identity } from './types/Identity.ts';

/** True when the identity may use the studio. */
export function isStaff(identity: Identity | null | undefined): boolean {
  return !!identity && identity.roles.some((r: Role) => staffRoles.includes(r));
}
