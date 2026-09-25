import { roles, type Role } from '@river/identity';

/**
 * Roles of a staff member signed in through Identity-Aware Proxy, from `RIVER_STAFF_ROLES`
 * ("a@x:administrator|editor,b@y:finance_steward"). Anyone else who passes IAP coordinates.
 */
export function staffRolesFor(email: string): Role[] {
  for (const pair of (process.env.RIVER_STAFF_ROLES ?? '').split(',')) {
    const [who, list] = pair.trim().split(':');
    if (who?.toLowerCase() === email.toLowerCase() && list) return list.split('|').filter((r): r is Role => (roles as readonly string[]).includes(r));
  }
  return ['coordinator'];
}
