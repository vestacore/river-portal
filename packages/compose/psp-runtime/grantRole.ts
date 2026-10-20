import { dutyConflicts, type PspRole } from '@river/psp-access';
import { guard } from './guard.ts';
import { grantText } from './grantText.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/**
 * Grants a person a role at a unit. Only within the grantor's own reach; never the hierarchy
 * administrator's role (that is granted by an administrator); never across a separation of duties.
 */
export function grantRole(world: World, actor: Actor, input: { personId: string; role: PspRole; unitId: string }, at: string): CommandResult<{ grantId: string }> {
  const denied = guard(world, actor, 'grants.write', input.unitId, at);
  if (denied) return { ok: false, error: denied };
  if (input.role === 'hierarchy_admin' && actor.kind === 'person' && actor.role !== 'hierarchy_admin') return { ok: false, error: 'only an administrator grants administration' };
  if (actor.kind === 'person' && actor.personId === input.personId) return { ok: false, error: 'nobody grants themselves' };
  const conflicts = dutyConflicts(world.units, world.grants, input);
  if (conflicts.length > 0) return { ok: false, error: `separation of duties: ${conflicts.join(', ')}` };
  const n = (world.counters.grant ?? 0) + 1;
  world.counters.grant = n;
  const grantId = `gr-${n.toString(36)}-${input.personId.slice(2)}`;
  world.grants.push({ id: grantId, personId: input.personId, role: input.role, unitId: input.unitId, grantedBy: actor.kind === 'person' ? actor.personId : 'system', grantedAt: at, expiresAt: null, status: 'active' });
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: input.unitId, action: 'grant.add', target: grantId, detail: grantText(world, input.personId, input.role, input.unitId), at });
  return { ok: true, value: { grantId } };
}
