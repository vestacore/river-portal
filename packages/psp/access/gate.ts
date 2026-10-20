// @river/psp-access — who may do what, where (adr/records/ADR-0026): roles of the cabinets, grants scoped
// to a unit and inherited down its subtree, permissions, separation of duties, requests decided by another.
export { pspRoles, permissions } from './types/Access.ts';
export type { PspRole, Permission, Person, Grant, AccessRequest, AuditEntry } from './types/Access.ts';
export { rolePermissions } from './data/rolePermissions.ts';
export { roleLabels } from './data/roleLabels.ts';
export { can } from './can.ts';
export { scopesOf } from './scopesOf.ts';
export { dutyConflicts } from './dutyConflicts.ts';
export { canDecideRequest } from './canDecideRequest.ts';
