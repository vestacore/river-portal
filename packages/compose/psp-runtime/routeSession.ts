import type { Rail } from '@river/psp-facts';
import { chooseRoute, type RouteStrategy } from '@river/psp-flow';
import { nearestOfKind, policyValue } from '@river/psp-units';
import { appendFacts } from './appendFacts.ts';
import { effectiveFor } from './effectiveFor.ts';
import { quoteAcquirers } from './quoteAcquirers.ts';
import { regionOf } from './regionOf.ts';
import type { World } from './types/World.ts';

/**
 * The routing event of an attempt: the unit's route rule, or its routing strategy over the providers the
 * stand is connected with — by approval, by the lowest expected fee under the merchant's terms, or on-us
 * first — never below the unit's approval threshold. The choice is recorded with every quote considered.
 */
export function routeSession(world: World, sessionId: string, rail: Rail, routeTo: string | null, at: string): void {
  const session = world.views.sessions.get(sessionId);
  if (!session) return;
  const region = regionOf(world, session.unitId);
  const entity = nearestOfKind(world.units, session.unitId, 'entity')?.id ?? session.merchantId;
  const weights = world.routeWeights[entity];
  const effective = effectiveFor(world, session.unitId);
  const strategy = String(policyValue(effective, 'routing.strategy') ?? 'approval_first') as RouteStrategy;
  const minApprovalBps = Number(policyValue(effective, 'routing.minApproval.bps') ?? 0);
  const { quotes, issuer } = quoteAcquirers(world, { merchantId: session.merchantId, unitId: session.unitId, rail, detail: session.detail, amountMinor: session.amountMinor });
  const route = chooseRoute({ rail, region, sessionId, routeTo, available: world.providers, strategy, minApprovalBps, quotes, ...(weights ? { weights } : {}) });
  appendFacts(world, sessionId, [{ type: 'route.Chosen', payload: {
    sessionId, rail, acquirer: route.acquirer, rule: route.rule, strategy, issuer, onUs: route.onUs, feeMinor: route.feeMinor,
    ...(quotes.length > 0 ? { alternatives: route.alternatives } : {}),
  } }], { via: 'figure', by: 'router' }, at);
}
