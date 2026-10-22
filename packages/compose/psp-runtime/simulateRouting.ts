import type { LocalisedText } from '@river/i18n';
import { chooseRoute, type RouteStrategy } from '@river/psp-flow';
import { acquirers, issuers } from '@river/psp-instruments';
import { nearestOfKind } from '@river/psp-units';
import { quoteAcquirers } from './quoteAcquirers.ts';
import { regionOf } from './regionOf.ts';
import type { World } from './types/World.ts';

const strategies: RouteStrategy[] = ['approval_first', 'least_cost', 'on_us_first'];

/**
 * The card payments of a period replayed under each routing strategy — the same deterministic routing a
 * live attempt uses, on the same quotes from the merchant's terms — with what each would have cost, its
 * on-us share and the expected change in approvals (from each acquirer's approval rate). Also the on-us
 * payments the approval threshold kept away, by acquirer.
 */
export function simulateRouting(world: World, input: { from: string; minApprovalBps: number; merchantId?: string }) {
  const approval = (id: string) => acquirers.find((a) => a.id === id)?.approvalBps ?? 9_000;
  const totals = Object.fromEntries(strategies.map((s) => [s, { strategy: s, feeMinor: 0, onUs: 0, approvalDelta: 0 }])) as Record<RouteStrategy, { strategy: RouteStrategy; feeMinor: number; onUs: number; approvalDelta: number }>;
  const blocked = new Map<string, { acquirer: string; acquirerName: LocalisedText; bankName: LocalisedText; approvalBps: number; sessions: number; savingMinor: number }>();
  let sessions = 0;
  let actualFee = 0;
  let actualOnUs = 0;
  let currency = 'UAH';
  for (const s of world.views.sessions.values()) {
    if (!s.route || s.route.rail !== 'card' || s.openedAt < input.from || (input.merchantId && s.merchantId !== input.merchantId)) continue;
    const { quotes } = quoteAcquirers(world, { merchantId: s.merchantId, unitId: s.unitId, rail: 'card', detail: s.detail, amountMinor: s.amountMinor });
    if (quotes.length === 0) continue;
    sessions += 1;
    currency = s.currency;
    const actual = quotes.find((q) => q.acquirer === s.route!.acquirer);
    actualFee += s.route.feeMinor ?? actual?.feeMinor ?? 0;
    if (s.route.onUs) actualOnUs += 1;
    const entity = nearestOfKind(world.units, s.unitId, 'entity')?.id ?? s.merchantId;
    for (const strategy of strategies) {
      const choice = chooseRoute({ rail: 'card', region: regionOf(world, s.unitId), sessionId: s.sessionId, routeTo: null, available: world.providers, strategy, minApprovalBps: input.minApprovalBps, quotes, ...(world.routeWeights[entity] ? { weights: world.routeWeights[entity] } : {}) });
      const t = totals[strategy];
      t.feeMinor += choice.feeMinor ?? 0;
      if (choice.onUs) t.onUs += 1;
      t.approvalDelta += approval(choice.acquirer) - approval(s.route.acquirer);
    }
    const own = quotes.find((q) => q.onUs);
    if (own && approval(own.acquirer) < input.minApprovalBps && own.acquirer !== s.route.acquirer) {
      const label = acquirers.find((a) => a.id === own.acquirer)?.label ?? { 'en-GB': own.acquirer, uk: own.acquirer };
      const b = blocked.get(own.acquirer) ?? { acquirer: own.acquirer, acquirerName: label, bankName: issuers.find((i) => i.acquirerIds.includes(own.acquirer))?.name ?? label, approvalBps: approval(own.acquirer), sessions: 0, savingMinor: 0 };
      b.sessions += 1;
      b.savingMinor += Math.max(0, (s.route.feeMinor ?? actual?.feeMinor ?? 0) - (own.feeMinor ?? 0));
      blocked.set(own.acquirer, b);
    }
  }
  const share = (n: number) => (sessions > 0 ? Math.round((n / sessions) * 10_000) : 0);
  return {
    sessions, currency, actualFeeMinor: actualFee, actualOnUsShareBps: share(actualOnUs),
    simulated: strategies.map((s) => ({ strategy: s, feeMinor: totals[s].feeMinor, onUsShareBps: share(totals[s].onUs), approvalDeltaBps: sessions > 0 ? Math.round(totals[s].approvalDelta / sessions) : 0 })),
    blockedOnUs: [...blocked.values()],
  };
}
