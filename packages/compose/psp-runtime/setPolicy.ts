import type { Permission } from '@river/psp-access';
import { checkSetting, findPolicyDefinition, type PolicySetting } from '@river/psp-units';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/**
 * Sets a policy on a unit (or clears it with `value: undefined`). The pay page's policies need the
 * designer's right, risk policies the compliance officer's, routing policies the payments manager's, and
 * the administrator may set any of them. A setting that would not take effect — a
 * unit above enforces it, or it is looser than what is allowed above — is refused with the reason.
 */
export function setPolicy(world: World, actor: Actor, input: { unitId: string; key: string; value: PolicySetting['value'] | undefined; mode: PolicySetting['mode']; note?: string }, at: string): CommandResult<{ issues: string[] }> {
  const definition = findPolicyDefinition(input.key);
  const rights: Permission[] = definition.group === 'checkout' ? ['checkout.write', 'policies.write'] : definition.group === 'risk' ? ['rules.write', 'policies.write'] : definition.group === 'routing' ? ['routing.write', 'policies.write'] : ['policies.write'];
  const refusals = rights.map((right) => guard(world, actor, right, input.unitId, at));
  if (refusals.every((r) => r !== null)) return { ok: false, error: refusals[0]! };
  const personId = actor.kind === 'person' ? actor.personId : 'system';
  const others = world.settings.filter((s) => !(s.unitId === input.unitId && s.key === input.key));
  if (input.value === undefined) {
    world.settings = others;
  } else {
    const setting: PolicySetting = { unitId: input.unitId, key: input.key, value: input.value, mode: input.mode, setBy: personId, setAt: at, ...(input.note ? { note: input.note } : {}) };
    const issues = checkSetting(world.units, others, setting);
    if (issues.length > 0) return { ok: false, error: issues.join('; ') };
    world.settings = [...others, setting];
  }
  world.version += 1;
  if (actor.kind === 'person') recordAudit(world, { personId, role: actor.role, unitId: input.unitId, action: input.value === undefined ? 'policy.clear' : input.mode === 'enforced' ? 'policy.enforce' : 'policy.set', target: input.key, detail: definition.label, at });
  return { ok: true, value: { issues: [] } };
}
