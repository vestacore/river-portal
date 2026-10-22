import { agentCatalogue, runSwarm, type AgentId, type Insight, type ReconciledBatch, type RoutingOutlook } from '@river/psp-agents';
import { acquirers } from '@river/psp-instruments';
import { policyValue } from '@river/psp-units';
import { applyProposal } from './applyProposal.ts';
import { effectiveFor } from './effectiveFor.ts';
import { posOutlook } from './posOutlook.ts';
import { reconcileSettlements } from './reconcileSettlements.ts';
import { simulateRouting } from './simulateRouting.ts';
import type { World } from './types/World.ts';

/**
 * One round of the swarm over the world as it is: new findings are recorded as open insights (a finding
 * already recorded keeps its decision; a newer finding of a series supersedes the one still open). Where a
 * unit's policy lets agents act alone, a low-risk proposal is carried out at once and recorded as done by
 * the policy — never a high-risk one.
 */
export function refreshSwarm(world: World, at: string): number {
  // Where the stand routes by its own acquiring terms, the agents also get the routing outlook (the last
  // fortnight replayed under each strategy), the stores' terminal costs and the reconciled batches.
  const root = world.units.find((u) => u.parentId === null)?.id ?? '';
  const priced = world.acquiring.length > 0;
  let routing: RoutingOutlook | null | undefined;
  if (priced) {
    const effective = effectiveFor(world, root);
    const minApprovalBps = Number(policyValue(effective, 'routing.minApproval.bps') ?? 0);
    const days = 14;
    const sim = simulateRouting(world, { from: new Date(Date.parse(at) - days * 86_400_000).toISOString(), minApprovalBps });
    routing = { unitId: root, strategy: String(policyValue(effective, 'routing.strategy') ?? 'approval_first'), minApprovalBps, days, ...sim };
  }
  const name = (id: string) => acquirers.find((a) => a.id === id)?.label ?? { 'en-GB': id, uk: id };
  const reconciled: ReconciledBatch[] | undefined = world.views.settlements.size > 0 ? reconcileSettlements(world, at).filter((r) => r.reconciliation.status !== 'matched').map(({ view, reconciliation }) => ({
    batchId: view.batchId, provider: view.provider, providerName: name(view.provider), merchantId: view.merchantId, storeId: view.storeId, channel: view.channel, businessDate: view.businessDate,
    currency: view.currency, status: reconciliation.status, grossMinor: view.sales?.grossMinor ?? view.reported?.grossMinor ?? null, netMinor: view.reported?.netMinor ?? null, differences: reconciliation.differences,
  })) : undefined;
  const drafts = runSwarm({
    now: at, units: world.units, orders: [...world.views.orders.values()], invoices: [...world.views.invoices.values()],
    sessions: [...world.views.sessions.values()], payments: [...world.views.payments.values()], alerts: world.alerts,
    onboarding: world.onboarding, endpoints: world.endpoints, deliveries: world.deliveries,
    settlement: policyValue(effectiveFor(world, root), 'settlement.model') === 'direct' ? 'direct' : 'custodial',
    ...(priced ? { routing, pos: posOutlook(world, at) } : {}), ...(reconciled ? { reconciled } : {}),
  }, agentCatalogue.map((a) => a.id));
  const known = new Set(world.insights.map((i) => `${i.agent}|${i.subject.kind}:${i.subject.id}|${i.proposal?.kind ?? ''}`));
  let added = 0;
  for (const draft of drafts) {
    const key = `${draft.agent}|${draft.subject.kind}:${draft.subject.id}|${draft.proposal?.kind ?? ''}`;
    if (known.has(key)) {
      // A standing condition found again a day later with other figures replaces its open finding; a decided one keeps its decision.
      const open = draft.series ? world.insights.find((i) => i.series === draft.series && i.status === 'open') : undefined;
      if (!open || open.finding['en-GB'] === draft.finding['en-GB'] || Date.parse(at) - Date.parse(open.at) < 86_400_000) continue;
    }
    const effective = effectiveFor(world, draft.unitId);
    const enabled = (policyValue(effective, 'agents.enabled') as AgentId[] | null) ?? [];
    if (!enabled.includes(draft.agent)) continue;
    const n = (world.counters.insight ?? 0) + 1;
    world.counters.insight = n;
    const insight: Insight = { ...draft, id: `ins_${n.toString(36).toUpperCase().padStart(5, '0')}`, at, status: 'open', decidedBy: null, decidedAt: null };
    if (draft.series) {
      for (const older of world.insights) {
        if (older.series === draft.series && older.status === 'open') { older.status = 'superseded'; older.decidedBy = 'swarm'; older.decidedAt = at; }
      }
    }
    world.insights.push(insight);
    known.add(key);
    added += 1;
    if (draft.proposal?.risk === 'low' && policyValue(effective, 'agents.autonomy') === 'act_low_risk') {
      applyProposal(world, insight, 'policy', at);
      insight.status = 'auto_applied';
      insight.decidedBy = 'policy';
      insight.decidedAt = at;
    }
  }
  // A standing condition no round finds any more is no longer current.
  const found = new Set(drafts.map((d) => d.series).filter((x): x is string => typeof x === 'string'));
  for (const insight of world.insights) {
    if (insight.status === 'open' && insight.series && !found.has(insight.series)) { insight.status = 'superseded'; insight.decidedBy = 'swarm'; insight.decidedAt = at; }
  }
  world.swarmAt = at;
  return added;
}
