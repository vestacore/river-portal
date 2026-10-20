import { guard } from './guard.ts';
import { grantText } from './grantText.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** Revokes a grant within the revoker's reach. Nobody revokes the profile they are acting in. */
export function revokeGrant(world: World, actor: Actor, grantId: string, at: string): CommandResult {
  const grant = world.grants.find((g) => g.id === grantId && g.status === 'active');
  if (!grant) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'grants.write', grant.unitId, at);
  if (denied) return { ok: false, error: denied };
  if (actor.kind === 'person' && actor.grantId === grantId) return { ok: false, error: 'not the profile you act in' };
  grant.status = 'revoked';
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: grant.unitId, action: 'grant.revoke', target: grantId, detail: grantText(world, grant.personId, grant.role, grant.unitId), at });
  return { ok: true, value: { grantId } };
}
