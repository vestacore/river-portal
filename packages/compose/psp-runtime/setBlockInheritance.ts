import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** Blocks (or restores) the inheritance of policies from above for one unit. Enforced policies still apply. */
export function setBlockInheritance(world: World, actor: Actor, unitId: string, block: boolean, at: string): CommandResult {
  const unit = world.units.find((u) => u.id === unitId);
  if (!unit || unit.parentId === null) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'policies.write', unit.parentId, at);
  if (denied) return { ok: false, error: denied };
  unit.blockInheritance = block;
  world.version += 1;
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId, action: block ? 'unit.block' : 'unit.unblock', target: unitId, detail: block ? { 'en-GB': 'Blocked inheritance', uk: 'Заблокував успадкування' } : { 'en-GB': 'Restored inheritance', uk: 'Відновив успадкування' }, at });
  return { ok: true, value: { unitId } };
}
