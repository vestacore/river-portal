import { agentCatalogue, runSwarm, type AgentId, type Insight } from '@river/psp-agents';
import { policyValue } from '@river/psp-units';
import { applyProposal } from './applyProposal.ts';
import { effectiveFor } from './effectiveFor.ts';
import type { World } from './types/World.ts';

/**
 * One round of the swarm over the world as it is: new findings are recorded as open insights (a finding
 * already recorded keeps its decision; a newer finding of a series supersedes the one still open). Where a
 * unit's policy lets agents act alone, a low-risk proposal is carried out at once and recorded as done by
 * the policy — never a high-risk one.
 */
export function refreshSwarm(world: World, at: string): number {
  const drafts = runSwarm({
    now: at, units: world.units, orders: [...world.views.orders.values()], invoices: [...world.views.invoices.values()],
    sessions: [...world.views.sessions.values()], payments: [...world.views.payments.values()], alerts: world.alerts,
    onboarding: world.onboarding, endpoints: world.endpoints, deliveries: world.deliveries,
  }, agentCatalogue.map((a) => a.id));
  const known = new Set(world.insights.map((i) => `${i.agent}|${i.subject.kind}:${i.subject.id}|${i.proposal?.kind ?? ''}`));
  let added = 0;
  for (const draft of drafts) {
    const key = `${draft.agent}|${draft.subject.kind}:${draft.subject.id}|${draft.proposal?.kind ?? ''}`;
    if (known.has(key)) continue;
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
  world.swarmAt = at;
  return added;
}
