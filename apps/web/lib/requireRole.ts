import { hasRole, type Identity, type Role } from '@river/identity';
import { getIdentity } from './getIdentity';

/** Defence in depth for Server Actions: the acting identity must hold one of the roles. */
export async function requireRole(...wanted: Role[]): Promise<Identity> {
  const identity = await getIdentity();
  if (!identity || !hasRole(identity, ...wanted)) throw new Error('Forbidden');
  return identity;
}
