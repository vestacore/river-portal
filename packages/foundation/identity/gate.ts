// @river/identity — roles, identities and signed demo sessions (adr/records/ADR-0021).
export { roles, staffRoles } from './types/Role.ts';
export type { Role } from './types/Role.ts';
export type { Identity } from './types/Identity.ts';
export type { SessionClaims } from './types/SessionClaims.ts';
export { hasRole } from './hasRole.ts';
export { isStaff } from './isStaff.ts';
export { signSession } from './signSession.ts';
export { verifySession } from './verifySession.ts';
