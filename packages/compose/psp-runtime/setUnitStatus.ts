import type { Unit } from '@river/psp-units';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** Suspends, reactivates or approves a unit. A suspended unit takes no new orders; what it holds stays. */
export function setUnitStatus(world: World, actor: Actor, unitId: string, status: Unit['status'], at: string): CommandResult {
  const unit = world.units.find((u) => u.id === unitId);
  if (!unit || unit.parentId === null) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, status === 'active' && unit.status === 'onboarding' ? 'aml.review' : 'units.write', unit.id, at);
  if (denied) return { ok: false, error: denied };
  unit.status = status;
  world.version += 1;
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId, action: `unit.${status}`, target: unitId, detail: unit.name, at });
  return { ok: true, value: { unitId } };
}
