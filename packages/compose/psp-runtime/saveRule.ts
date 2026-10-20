import type { RiskRule } from '@river/psp-risk';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** Adds or changes a rule on a unit, or switches one off. A rule enforced above cannot be switched off below. */
export function saveRule(world: World, actor: Actor, rule: RiskRule, at: string): CommandResult {
  const denied = guard(world, actor, 'rules.write', rule.unitId, at);
  if (denied) return { ok: false, error: denied };
  const enforcedAbove = world.rules.find((r) => r.id === rule.id && r.unitId !== rule.unitId && r.enforced);
  if (enforcedAbove && !rule.enabled) return { ok: false, error: `enforced:${enforcedAbove.unitId}` };
  world.rules = [...world.rules.filter((r) => !(r.id === rule.id && r.unitId === rule.unitId)), rule];
  world.version += 1;
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: rule.unitId, action: rule.enabled ? 'rule.save' : 'rule.off', target: rule.id, detail: rule.name, at });
  return { ok: true, value: { ruleId: rule.id } };
}
