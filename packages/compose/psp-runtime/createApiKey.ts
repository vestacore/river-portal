import { randomBytes } from 'node:crypto';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** Creates an API key for a unit. The full secret is returned once and never kept: only its prefix and last four. */
export function createApiKey(world: World, actor: Actor, input: { unitId: string; label: string; mode: 'test' | 'live'; kind: 'secret' | 'publishable' }, at: string): CommandResult<{ keyId: string; secret: string }> {
  const denied = guard(world, actor, 'keys.manage', input.unitId, at);
  if (denied) return { ok: false, error: denied };
  const n = (world.counters.key ?? 0) + 1;
  world.counters.key = n;
  const prefix = `rp_${input.mode}_${input.kind === 'secret' ? 'sk' : 'pk'}`;
  const secret = `${prefix}_${randomBytes(18).toString('base64url')}`;
  const keyId = `key-${n.toString(36)}-${input.unitId.slice(3, 9)}`;
  world.keys.push({ id: keyId, unitId: input.unitId, label: input.label || 'New key', mode: input.mode, kind: input.kind, prefix, last4: secret.slice(-4), createdAt: at, createdBy: actor.kind === 'person' ? actor.personId : 'system', lastUsedAt: null, status: 'active' });
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: input.unitId, action: 'key.create', target: keyId, detail: { 'en-GB': `${input.mode} ${input.kind} key`, uk: `${input.mode} ${input.kind} ключ` }, at });
  return { ok: true, value: { keyId, secret } };
}
