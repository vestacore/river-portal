import { isFactType, type FactType } from '@river/psp-facts';
import { guard } from './guard.ts';
import { recordAudit } from './recordAudit.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/**
 * Adds or changes a webhook endpoint of a unit: an https address, the facts it wants (or all), on or off.
 * Only addresses under `.example` are accepted in the demo — nothing is ever sent anywhere.
 */
export function saveEndpoint(world: World, actor: Actor, input: { endpointId?: string; unitId: string; url: string; events: string[]; enabled: boolean; description: string }, at: string): CommandResult<{ endpointId: string }> {
  const denied = guard(world, actor, 'webhooks.manage', input.unitId, at);
  if (denied) return { ok: false, error: denied };
  let url: URL;
  try { url = new URL(input.url); } catch { return { ok: false, error: 'url_invalid' }; }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.example')) return { ok: false, error: 'demo endpoints must be https and under .example' };
  const events = input.events.includes('*') ? ['*' as const] : input.events.filter(isFactType) as FactType[];
  if (events.length === 0) return { ok: false, error: 'choose at least one event' };
  const existing = input.endpointId ? world.endpoints.find((e) => e.id === input.endpointId) : undefined;
  if (existing) Object.assign(existing, { url: url.toString(), events, status: input.enabled ? 'enabled' : 'disabled', description: input.description });
  const endpointId = existing?.id ?? `wh-${((world.counters.endpoint = (world.counters.endpoint ?? 0) + 1)).toString(36)}-${input.unitId.slice(3, 8)}`;
  if (!existing) world.endpoints.push({ id: endpointId, unitId: input.unitId, url: url.toString(), events, status: input.enabled ? 'enabled' : 'disabled', secretHint: `whsec_…${endpointId.slice(-4)}`, createdAt: at, description: input.description });
  if (actor.kind === 'person') recordAudit(world, { personId: actor.personId, role: actor.role, unitId: input.unitId, action: existing ? 'endpoint.update' : 'endpoint.create', target: endpointId, detail: { 'en-GB': url.toString(), uk: url.toString() }, at });
  return { ok: true, value: { endpointId } };
}
