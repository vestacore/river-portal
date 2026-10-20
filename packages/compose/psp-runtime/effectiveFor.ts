import { resolvePolicies, type EffectivePolicy } from '@river/psp-units';
import type { World } from './types/World.ts';

const cache = new WeakMap<World, { version: string; byUnit: Map<string, EffectivePolicy[]> }>();

/** A unit's effective policies, resolved down the hierarchy — cached until a unit or a setting changes. */
export function effectiveFor(world: World, unitId: string): EffectivePolicy[] {
  const version = `${world.settings.length}|${world.settings.map((s) => s.setAt).join('')}|${world.units.map((u) => `${u.id}${u.blockInheritance ? 1 : 0}${u.parentId}`).join('')}`;
  let entry = cache.get(world);
  if (!entry || entry.version !== version) { entry = { version, byUnit: new Map() }; cache.set(world, entry); }
  let resolved = entry.byUnit.get(unitId);
  if (!resolved) { resolved = resolvePolicies(world.units, world.settings, unitId); entry.byUnit.set(unitId, resolved); }
  return resolved;
}
