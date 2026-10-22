import type { PspFact } from '@river/psp-facts';
import { nextRetryAt, subscribes, webhookEventOf } from '@river/psp-integration';
import { isWithin } from '@river/psp-units';
import type { World } from './types/World.ts';
import { unitOfFact } from './unitOfFact.ts';

/**
 * Releases a fact to the endpoints that want it: an endpoint set on a unit hears the facts of its whole
 * subtree. The stand-in receivers answer as their demo story says — one of them is failing right now.
 */
export function releaseWebhooks(world: World, fact: PspFact): void {
  if (world.quiet) return;
  const event = webhookEventOf(fact);
  if (!event) return;
  const unitId = unitOfFact(world, fact);
  if (!unitId) return;
  for (const endpoint of world.endpoints) {
    if (!subscribes(endpoint, fact.type) || !isWithin(world.units, unitId, endpoint.unitId)) continue;
    const story = world.failing.find((f) => f.endpointId === endpoint.id);
    const failing = story !== undefined && Date.parse(fact.at) > Date.parse(world.startedAt) - story.hours * 3_600_000 && !world.counters[`fixed:${endpoint.id}`];
    const seq = (world.counters.delivery ?? 0) + 1;
    world.counters.delivery = seq;
    const ms = 80 + ((seq * 37) % 340);
    world.deliveries.push({
      id: `whd_${seq.toString(36).toUpperCase().padStart(6, '0')}`, endpointId: endpoint.id, eventId: event.id, type: fact.type,
      subjectId: fact.stream, at: fact.at, attempt: 1, status: failing ? 'failed' : 'delivered', httpStatus: failing ? 500 : 200,
      durationMs: failing ? 1_800 + (seq % 400) : ms, error: failing ? 'HTTP 500: Internal Server Error' : null, nextRetryAt: failing ? nextRetryAt(1, fact.at) : null,
    });
  }
}
