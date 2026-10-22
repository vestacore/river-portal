import { guard } from './guard.ts';
import type { Actor, CommandResult, World } from './types/World.ts';

/** Sends a test event to an endpoint, so an integrator can check their handler and its signature check. */
export function sendTestEvent(world: World, actor: Actor, endpointId: string, at: string): CommandResult<{ deliveryId: string }> {
  const endpoint = world.endpoints.find((e) => e.id === endpointId);
  if (!endpoint) return { ok: false, error: 'not_found' };
  const denied = guard(world, actor, 'webhooks.manage', endpoint.unitId, at);
  if (denied) return { ok: false, error: denied };
  const seq = (world.counters.delivery ?? 0) + 1;
  world.counters.delivery = seq;
  const failing = world.failing.some((f) => f.endpointId === endpoint.id) && !world.counters[`fixed:${endpoint.id}`];
  const deliveryId = `whd_${seq.toString(36).toUpperCase().padStart(6, '0')}`;
  world.deliveries.push({ id: deliveryId, endpointId, eventId: `evt_test_${seq}`, type: 'session.Succeeded', subjectId: 'test', at, attempt: 1, status: failing ? 'failed' : 'delivered', httpStatus: failing ? 500 : 200, durationMs: failing ? 1_912 : 121, error: failing ? 'HTTP 500: Internal Server Error' : null, nextRetryAt: null });
  return { ok: true, value: { deliveryId } };
}
