import type { Rail } from '@river/psp-facts';
import { chooseRoute } from '@river/psp-flow';
import { appendFacts } from './appendFacts.ts';
import { regionOf } from './regionOf.ts';
import type { World } from './types/World.ts';

/** The routing bridge of an attempt: the unit's route rule, or the entity's weights between its acquirers. */
export function routeSession(world: World, sessionId: string, rail: Rail, routeTo: string | null, at: string): void {
  const session = world.views.sessions.get(sessionId);
  if (!session) return;
  const region = regionOf(world, session.unitId);
  const entity = region === 'EU' ? 'ou-eu' : 'ou-ua';
  const weights = world.routeWeights[entity];
  const route = chooseRoute({ rail, region, sessionId, routeTo, ...(weights ? { weights } : {}) });
  appendFacts(world, sessionId, [{ type: 'route.Chosen', payload: { sessionId, rail, acquirer: route.acquirer, rule: route.rule } }], { via: 'figure', by: 'router' }, at);
}
