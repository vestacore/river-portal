import { headers } from 'next/headers';
import { readConfig } from '@river/runtime';
import type { ActorRole } from '@river/log';

export type Staff = { email: string; role: ActorRole };

/**
 * The signed-in staff member (identity set by proxy.ts from IAP), or null. Always null on the public
 * surface. Roles come from `RIVER_STAFF_ROLES` ("a@x:administrator,b@y:editor"); others coordinate.
 */
export async function getStaff(): Promise<Staff | null> {
  const { surface } = readConfig();
  if (surface === 'public') return null;
  const email = (await headers()).get('x-river-staff');
  if (!email) return null;
  const roles = new Map(
    (process.env.RIVER_STAFF_ROLES ?? '').split(',').map((pair) => pair.trim().split(':') as [string, ActorRole]).filter(([e, r]) => e && r),
  );
  return { email, role: roles.get(email) ?? (surface === 'local' ? 'administrator' : 'coordinator') };
}
