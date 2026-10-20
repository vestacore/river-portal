import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** Revokes an API key: calls made with it are refused from now on. */
export function revokeApiKey(world: World, actor: Actor, keyId: string, at: string): CommandResult {
  const key = world.keys.find((k) => k.id === keyId && k.status === 'active');
  if (!key) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'keys.manage', key.unitId, at);
  if (denied) return { ok: false, error: denied };
  key.status = 'revoked';
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: key.unitId, action: 'key.revoke', target: keyId, detail: { 'en-GB': key.label, uk: key.label }, at });
  return { ok: true, value: { keyId } };
}
