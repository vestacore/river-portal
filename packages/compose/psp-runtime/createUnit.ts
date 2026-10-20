import type { LocalisedText } from '@river/i18n';
import type { Unit } from '@river/psp-units';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** Creates a unit under a parent. A merchant starts in onboarding: it trades once its checks and contract are done. */
export function createUnit(world: World, actor: Actor, input: { parentId: string; kind: Unit['kind']; name: LocalisedText; code: string }, at: string): CommandResult<{ unitId: string }> {
  const parent = world.units.find((u) => u.id === input.parentId);
  if (!parent) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'units.write', parent.id, at);
  if (denied) return { ok: false, error: denied };
  if (!input.name['en-GB'] || !input.name.uk) return { ok: false, error: 'a name in both languages' };
  const slug = input.name['en-GB'].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'unit';
  let id = `ou-${slug}`;
  for (let i = 2; world.units.some((u) => u.id === id); i += 1) id = `ou-${slug}-${i}`;
  world.units.push({ id, parentId: parent.id, kind: input.kind, name: input.name, code: input.code || id.slice(3).toUpperCase(), country: parent.country, currency: parent.currency,
    status: input.kind === 'merchant' ? 'onboarding' : 'active', blockInheritance: false, mcc: null, channel: input.kind === 'store' ? 'web' : null, createdAt: at });
  world.version += 1;
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: id, action: 'unit.create', target: id, detail: input.name, at });
  return { ok: true, value: { unitId: id } };
}
